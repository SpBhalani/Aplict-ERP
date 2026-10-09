import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { sql } from 'drizzle-orm';
import { createDatabase } from './database';
import type { DatabasePort } from '../../ports/database.port';

/**
 * Integration tests for the kernel database layer (T-002). These run
 * against a real PostgreSQL instance started by Testcontainers, never a
 * shared database, per .claude/rules/tests.md.
 *
 * A plain `pg` Client (`verifyClient`), independent of the `createDatabase`
 * adapter under test, is used to set up and inspect a scratch table so the
 * assertions don't depend on the very transaction helper they're checking.
 */

const TABLE = 't002_scratch_rows';

describe('createDatabase (integration, real PostgreSQL via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let connectionUri: string;
  let verifyClient: Client;
  let db: DatabasePort;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    connectionUri = container.getConnectionUri();

    verifyClient = new Client({ connectionString: connectionUri });
    await verifyClient.connect();
    await verifyClient.query(`CREATE TABLE ${TABLE} (id serial primary key, value text not null)`);

    db = createDatabase({ databaseUrl: connectionUri });
  }, 60_000);

  afterEach(async () => {
    // Per-test isolation: truncate rather than recreate the container.
    await verifyClient.query(`TRUNCATE TABLE ${TABLE}`);
  });

  afterAll(async () => {
    await db.close();
    await verifyClient.query(`DROP TABLE IF EXISTS ${TABLE}`);
    await verifyClient.end();
    await container.stop();
  }, 30_000);

  async function rowCount(): Promise<number> {
    const result = await verifyClient.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ${TABLE}`,
    );
    return result.rows[0]?.count ?? -1;
  }

  interface ExecutableDb {
    execute(query: unknown): Promise<unknown>;
  }

  async function insertViaTx(txDb: ExecutableDb, value: string): Promise<void> {
    await txDb.execute(sql.raw(`INSERT INTO ${TABLE} (value) VALUES ('${value}')`));
  }

  it('opens a pool that answers queries right after createDatabase is called', async () => {
    await expect(db.ping()).resolves.toBe(true);
  });

  it('commits all writes made inside the callback when it resolves', async () => {
    await db.transaction(async (tx) => {
      await insertViaTx(tx.db, 'commit-row');
    });

    expect(await rowCount()).toBe(1);
  });

  it('rolls back all writes made inside the callback when it throws', async () => {
    await expect(
      db.transaction(async (tx) => {
        await insertViaTx(tx.db, 'should-not-survive');
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(await rowCount()).toBe(0);
  });

  it('reuses the outer transaction id for a nested transaction call instead of opening a second one', async () => {
    const seenInnerIds: string[] = [];

    await db.transaction(async (outerTx) => {
      await db.transaction(async (innerTx) => {
        seenInnerIds.push(innerTx.id);
      });
      expect(seenInnerIds).toEqual([outerTx.id]);
    });
  });

  it('rolls back writes made in a nested transaction call when the outer transaction later throws', async () => {
    await expect(
      db.transaction(async (outerTx) => {
        await db.transaction(async (innerTx) => {
          expect(innerTx.id).toBe(outerTx.id);
          await insertViaTx(innerTx.db, 'nested-row');
        });
        throw new Error('outer failed after nested write');
      }),
    ).rejects.toThrow('outer failed after nested write');

    // The nested call reused the outer transaction, so the outer rollback
    // must also undo the write the nested call made.
    expect(await rowCount()).toBe(0);
  });

  it('passes a tx whose id is a non-empty string, satisfying the kernel TransactionHandle port', async () => {
    await db.transaction(async (tx) => {
      expect(typeof tx.id).toBe('string');
      expect(tx.id.length).toBeGreaterThan(0);
    });
  });

  it('exposes a working drizzle handle on tx that adapters can run queries with', async () => {
    await db.transaction(async (tx) => {
      expect(tx.db).toBeDefined();
      await insertViaTx(tx.db, 'drizzle-handle-check');
    });

    const result = await verifyClient.query(
      `SELECT value FROM ${TABLE} WHERE value = 'drizzle-handle-check'`,
    );
    expect(result.rowCount).toBe(1);
  });

  it('ends the pool on close() so a later ping reports the database as unavailable', async () => {
    const closable = createDatabase({ databaseUrl: connectionUri });
    await expect(closable.ping()).resolves.toBe(true);

    await closable.close();

    await expect(closable.ping()).resolves.toBe(false);
  });

  it('resolves ping() false instead of throwing when the database cannot be reached', async () => {
    const unreachable = createDatabase({
      databaseUrl: 'postgres://user:pass@127.0.0.1:1/does-not-exist',
    });

    await expect(unreachable.ping()).resolves.toBe(false);

    await unreachable.close();
  });

  it('resolves ping() within 2 seconds even when the database never responds', async () => {
    // A non-routable address (RFC 5737 TEST-NET-1) so the connection attempt
    // hangs instead of failing fast with connection-refused; this proves
    // ping() enforces its own timeout rather than relying on the OS default.
    const unresponsive = createDatabase({
      databaseUrl: 'postgres://user:pass@192.0.2.1:5432/does-not-exist',
    });

    const start = Date.now();
    const result = await unresponsive.ping();
    const elapsed = Date.now() - start;

    expect(result).toBe(false);
    expect(elapsed).toBeLessThan(2_500);

    await unresponsive.close();
  }, 10_000);
});
