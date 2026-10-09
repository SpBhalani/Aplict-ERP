import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { migrate } from './migrate';

/**
 * Integration tests for the kernel migration runner (T-003 / ADR-0002 D3).
 * These run against a real PostgreSQL instance started by Testcontainers,
 * never a shared database, per .claude/rules/tests.md. There is no fake-adapter
 * version of this test: a migration runner's whole job is talking to a real
 * database (advisory locks, DDL, transactions per file), so there is nothing
 * meaningful to fake.
 *
 * `migrate` does not exist yet (T-003 is not implemented). The call shape
 * below is the contract these tests fix, chosen from the task's literal
 * acceptance signature `migrate(db, [{ module, schema, dir }])`:
 *
 *   migrate(databaseUrl: string, modules: Array<{
 *     module: string; // recorded in kernel.schema_migrations
 *     schema: string; // Postgres schema created for this module
 *     dir: string;    // directory holding this module's NNNN_*.sql files
 *   }>): Promise<void>
 *
 * `db` is a plain connection string (not a DatabasePort) because the runner
 * needs an advisory lock and bare DDL (CREATE SCHEMA) outside of any single
 * transaction wrapper -- lower-level access than DatabasePort.transaction()
 * offers.
 *
 * Kernel's own migrations (packages/kernel/migrations/0001_kernel.sql, per
 * the task's change spec) are assumed to run automatically, first, on every
 * call -- recorded as module 'kernel' / schema 'kernel' in
 * kernel.schema_migrations -- without the caller passing them in the
 * `modules` array. Applied rows are assumed to carry (module, file,
 * checksum, applied_at) columns, per ADR-0002 D3's literal wording.
 *
 * A plain `pg` Client (`verifyClient`), independent of the migrate() adapter
 * under test, is used to inspect database state so assertions don't depend
 * on the very runner they're checking.
 */

interface FixtureModule {
  readonly module: string;
  readonly schema: string;
  readonly dir: string;
  readonly dispose: () => Promise<void>;
}

describe('migrate (integration, real PostgreSQL via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let connectionUri: string;
  let verifyClient: Client;
  const fixtures: FixtureModule[] = [];

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    connectionUri = container.getConnectionUri();

    verifyClient = new Client({ connectionString: connectionUri });
    await verifyClient.connect();
  }, 60_000);

  afterEach(async () => {
    for (const fixture of fixtures.splice(0, fixtures.length)) {
      await fixture.dispose();
    }
  });

  afterAll(async () => {
    await verifyClient.end();
    await container.stop();
  }, 30_000);

  /** Creates a fresh temp directory with the given NNNN_*.sql files for one fixture module. */
  async function prepareFixture(
    filesFactory: (schema: string) => Record<string, string>,
  ): Promise<FixtureModule> {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 10);
    const schema = `sample_${suffix}`;
    const module = `sample-${suffix}`;
    const dir = await mkdtemp(join(tmpdir(), `kernel-migrate-${suffix}-`));

    const files = filesFactory(schema);
    for (const [filename, contents] of Object.entries(files)) {
      await writeFile(join(dir, filename), contents, 'utf8');
    }

    return {
      module,
      schema,
      dir,
      dispose: () => rm(dir, { recursive: true, force: true }),
    };
  }

  async function schemaExists(schema: string): Promise<boolean> {
    const result = await verifyClient.query(
      'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
      [schema],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async function tableExists(schema: string, table: string): Promise<boolean> {
    const result = await verifyClient.query(
      'SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
      [schema, table],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async function countRows(schema: string, table: string): Promise<number> {
    const result = await verifyClient.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ${schema}.${table}`,
    );
    return result.rows[0]?.count ?? -1;
  }

  /** Files recorded for a module, oldest-applied first. */
  async function appliedFiles(moduleName: string): Promise<string[]> {
    const result = await verifyClient.query<{ file: string }>(
      'SELECT file FROM kernel.schema_migrations WHERE module = $1 ORDER BY applied_at ASC',
      [moduleName],
    );
    return result.rows.map((row) => row.file);
  }

  async function captureError(fn: () => Promise<unknown>): Promise<Error | undefined> {
    try {
      await fn();
      return undefined;
    } catch (error) {
      return error as Error;
    }
  }

  it("creates a module's schema before applying its first migration file", async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key);`,
    }));
    fixtures.push(fixture);

    expect(await schemaExists(fixture.schema)).toBe(false);

    await migrate(connectionUri, [fixture]);

    expect(await schemaExists(fixture.schema)).toBe(true);
    expect(await tableExists(fixture.schema, 'proof')).toBe(true);
  }, 30_000);

  it("applies a module's migration files in ascending numeric filename order so later files can depend on earlier ones", async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.sequence_proof (id serial primary key, step text not null);`,
      '0002_alter_table.sql': `ALTER TABLE ${schema}.sequence_proof ADD COLUMN position integer; INSERT INTO ${schema}.sequence_proof (step, position) VALUES ('second', 2);`,
      '0003_seed.sql': `INSERT INTO ${schema}.sequence_proof (step, position) VALUES ('third', 3);`,
    }));
    fixtures.push(fixture);

    // If files ran out of numeric order, 0002's ALTER TABLE would fail
    // because 0001's CREATE TABLE had not run yet.
    await migrate(connectionUri, [fixture]);

    const rows = await verifyClient.query<{ step: string }>(
      `SELECT step FROM ${fixture.schema}.sequence_proof ORDER BY position`,
    );
    expect(rows.rows.map((row) => row.step)).toEqual(['second', 'third']);

    expect(await appliedFiles(fixture.module)).toEqual([
      '0001_create_table.sql',
      '0002_alter_table.sql',
      '0003_seed.sql',
    ]);
  }, 30_000);

  it('records each applied file with a checksum so running migrate again applies nothing twice', async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key); INSERT INTO ${schema}.proof DEFAULT VALUES;`,
      '0002_more.sql': `INSERT INTO ${schema}.proof DEFAULT VALUES;`,
    }));
    fixtures.push(fixture);

    await migrate(connectionUri, [fixture]);

    const firstRunFiles = await appliedFiles(fixture.module);
    expect(firstRunFiles).toEqual(['0001_create_table.sql', '0002_more.sql']);
    expect(await countRows(fixture.schema, 'proof')).toBe(2);

    const checksums = await verifyClient.query<{ checksum: string }>(
      'SELECT checksum FROM kernel.schema_migrations WHERE module = $1 ORDER BY file',
      [fixture.module],
    );
    for (const row of checksums.rows) {
      expect(typeof row.checksum).toBe('string');
      expect(row.checksum.length).toBeGreaterThan(0);
    }

    await migrate(connectionUri, [fixture]); // run again, nothing new to apply

    expect(await appliedFiles(fixture.module)).toEqual(firstRunFiles);
    expect(await countRows(fixture.schema, 'proof')).toBe(2);
  }, 30_000);

  it("stops with an error naming the module and file when a previously applied file's checksum has changed", async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key);`,
    }));
    fixtures.push(fixture);

    await migrate(connectionUri, [fixture]);

    await writeFile(
      join(fixture.dir, '0001_create_table.sql'),
      `CREATE TABLE ${fixture.schema}.proof (id serial primary key); -- edited after being applied`,
      'utf8',
    );

    const error = await captureError(() => migrate(connectionUri, [fixture]));

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain(fixture.module);
    expect(error?.message).toContain('0001_create_table.sql');
  }, 30_000);

  it('rolls back only the failing file, stops, and names the file and SQL error', async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key, step text not null); INSERT INTO ${schema}.proof (step) VALUES ('first');`,
      '0002_broken.sql': `INSERT INTO ${schema}.does_not_exist (step) VALUES ('second');`,
      '0003_never_reached.sql': `INSERT INTO ${schema}.proof (step) VALUES ('third');`,
    }));
    fixtures.push(fixture);

    const error = await captureError(() => migrate(connectionUri, [fixture]));

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain(fixture.module);
    expect(error?.message).toContain('0002_broken.sql');

    // 0001 ran in its own transaction and stays committed despite the later failure.
    expect(await tableExists(fixture.schema, 'proof')).toBe(true);
    const rows = await verifyClient.query<{ step: string }>(
      `SELECT step FROM ${fixture.schema}.proof`,
    );
    expect(rows.rows.map((row) => row.step)).toEqual(['first']);

    // 0002 was rolled back (not recorded) and 0003 was never attempted.
    expect(await appliedFiles(fixture.module)).toEqual(['0001_create_table.sql']);
  }, 30_000);

  it('lets a second concurrent migrate call wait on the advisory lock so each file is applied exactly once', async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.lock_proof (id serial primary key); INSERT INTO ${schema}.lock_proof DEFAULT VALUES; INSERT INTO ${schema}.lock_proof DEFAULT VALUES; INSERT INTO ${schema}.lock_proof DEFAULT VALUES;`,
    }));
    fixtures.push(fixture);

    await Promise.all([migrate(connectionUri, [fixture]), migrate(connectionUri, [fixture])]);

    // Exactly one apply happened: 3 rows (not 6) and one schema_migrations row.
    expect(await countRows(fixture.schema, 'lock_proof')).toBe(3);

    const recorded = await verifyClient.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM kernel.schema_migrations WHERE module = $1 AND file = $2',
      [fixture.module, '0001_create_table.sql'],
    );
    expect(recorded.rows[0]?.count).toBe(1);
  }, 30_000);

  it("always applies the kernel's own migrations before any module in the list", async () => {
    const fixture = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key);`,
    }));
    fixtures.push(fixture);

    await migrate(connectionUri, [fixture]);

    expect(await tableExists('kernel', 'schema_migrations')).toBe(true);
    expect(await tableExists('kernel', 'outbox')).toBe(true);
    expect(await tableExists('kernel', 'processed_events')).toBe(true);

    const kernelFirstApplied = await verifyClient.query<{ applied_at: Date }>(
      "SELECT min(applied_at) AS applied_at FROM kernel.schema_migrations WHERE module = 'kernel'",
    );
    const moduleFirstApplied = await verifyClient.query<{ applied_at: Date }>(
      'SELECT min(applied_at) AS applied_at FROM kernel.schema_migrations WHERE module = $1',
      [fixture.module],
    );

    const kernelTime = kernelFirstApplied.rows[0]?.applied_at;
    const moduleTime = moduleFirstApplied.rows[0]?.applied_at;
    expect(kernelTime).toBeTruthy();
    expect(moduleTime).toBeTruthy();
    expect(new Date(kernelTime as Date).getTime()).toBeLessThanOrEqual(
      new Date(moduleTime as Date).getTime(),
    );
  }, 30_000);

  it("never touches or drops a module's schema when that module is left out of a later migrate call", async () => {
    const fixtureA = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key);`,
    }));
    const fixtureB = await prepareFixture((schema) => ({
      '0001_create_table.sql': `CREATE TABLE ${schema}.proof (id serial primary key); INSERT INTO ${schema}.proof DEFAULT VALUES;`,
    }));
    fixtures.push(fixtureA);

    await migrate(connectionUri, [fixtureA, fixtureB]);

    expect(await schemaExists(fixtureB.schema)).toBe(true);
    expect(await countRows(fixtureB.schema, 'proof')).toBe(1);

    // Remove module B's directory entirely: if a later migrate() call ever
    // tried to read or re-apply it, this would throw ENOENT.
    await fixtureB.dispose();

    await migrate(connectionUri, [fixtureA]); // B omitted from the list

    expect(await schemaExists(fixtureB.schema)).toBe(true); // not dropped
    expect(await countRows(fixtureB.schema, 'proof')).toBe(1); // not touched
  }, 30_000);
});
