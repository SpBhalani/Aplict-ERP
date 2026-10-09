import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from 'pg';

/**
 * Applies kernel and module migrations safely, in order, once (ADR-0002 D3).
 *
 * Uses a raw pg Client (not Pool, not Drizzle): a single held session is
 * needed for the Postgres advisory lock plus bare multi-statement DDL
 * (CREATE SCHEMA) outside of any single transaction wrapper -- lower-level
 * than DatabasePort.transaction() offers.
 */

export interface MigrationModule {
  readonly module: string;
  readonly schema: string;
  readonly dir: string;
}

/** Fixed advisory lock key: arbitrary but constant across every migrate() call on this codebase. */
const MIGRATE_LOCK_KEY = 72_190_045;

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]*$/;
const MIGRATION_FILE_PATTERN = /^(\d{4})_.*\.sql$/;

const kernelMigrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../../../migrations');

const KERNEL_MODULE: MigrationModule = {
  module: 'kernel',
  schema: 'kernel',
  dir: kernelMigrationsDir,
};

/** Exported for direct unit testing (migrate.test.ts) — not part of the kernel's public API. */
export function assertIdentifier(kind: string, value: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`invalid ${kind} identifier: ${value}`);
  }
}

async function bootstrapSchemaMigrationsTable(client: Client): Promise<void> {
  await client.query('CREATE SCHEMA IF NOT EXISTS kernel');
  await client.query(`
    CREATE TABLE IF NOT EXISTS kernel.schema_migrations (
      module text not null,
      file text not null,
      checksum text not null,
      applied_at timestamptz not null default now(),
      primary key (module, file)
    )
  `);
}

async function listMigrationFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((entry) => MIGRATION_FILE_PATTERN.test(entry))
    .sort((a, b) => {
      const aMatch = MIGRATION_FILE_PATTERN.exec(a);
      const bMatch = MIGRATION_FILE_PATTERN.exec(b);
      const aNum = Number(aMatch?.[1] ?? 0);
      const bNum = Number(bMatch?.[1] ?? 0);
      return aNum - bNum;
    });
}

async function applyFile(client: Client, module: string, file: string, dir: string): Promise<void> {
  const contents = await readFile(join(dir, file), 'utf8');
  const checksum = createHash('sha256').update(contents).digest('hex');

  const existing = await client.query<{ checksum: string }>(
    'SELECT checksum FROM kernel.schema_migrations WHERE module = $1 AND file = $2',
    [module, file],
  );
  const existingRow = existing.rows[0];

  if (existingRow) {
    if (existingRow.checksum === checksum) {
      return; // already applied correctly
    }
    throw new Error(`migration ${module}/${file}: file content changed after being applied`);
  }

  try {
    await client.query('BEGIN');
    await client.query(contents);
    await client.query(
      'INSERT INTO kernel.schema_migrations (module, file, checksum, applied_at) VALUES ($1, $2, $3, now())',
      [module, file, checksum],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`migration ${module}/${file} failed: ${message}`);
  }
}

async function applyModule(
  client: Client,
  { module, schema, dir }: MigrationModule,
): Promise<void> {
  assertIdentifier('module', module);
  assertIdentifier('schema', schema);

  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  const files = await listMigrationFiles(dir);
  for (const file of files) {
    await applyFile(client, module, file, dir);
  }
}

export async function migrate(databaseUrl: string, modules: MigrationModule[]): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATE_LOCK_KEY]);
    try {
      await bootstrapSchemaMigrationsTable(client);
      const allModules = [KERNEL_MODULE, ...modules];
      for (const module of allModules) {
        await applyModule(client, module);
      }
    } finally {
      await client
        .query('SELECT pg_advisory_unlock($1)', [MIGRATE_LOCK_KEY])
        .catch(() => undefined);
    }
  } finally {
    await client.end();
  }
}
