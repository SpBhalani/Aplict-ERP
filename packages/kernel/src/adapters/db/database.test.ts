import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fast, no-database tests for the database layer (T-002).
 *
 * The real pool/transaction/ping behaviour needs a live PostgreSQL instance
 * and lives in database.int.test.ts instead. This file only covers things
 * that can be checked without a network connection: the import boundary
 * ("only src/adapters/db/ may import drizzle-orm or pg") and that the
 * adapter module exposes the factory function modules will depend on.
 */

const here = dirname(fileURLToPath(import.meta.url));
// packages/kernel/src/adapters/db -> packages/kernel/src
const KERNEL_SRC = join(here, '..', '..');
const ALLOWED_SEGMENT = `${join('adapters', 'db')}${''}`; // normalized below

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function isUnderAllowedDir(absolutePath: string): boolean {
  const normalized = absolutePath.split('\\').join('/');
  return normalized.includes(`/${ALLOWED_SEGMENT.split('\\').join('/')}/`);
}

function filesImporting(moduleName: string, files: string[]): string[] {
  // Matches `from 'drizzle-orm'`, `from 'drizzle-orm/node-postgres'`, `from "pg"`,
  // and the equivalent `require(...)` form, but not unrelated package names
  // that merely contain the same substring (e.g. "@types/pg").
  const importRegex = new RegExp(
    `(from\\s+['"]${moduleName}(?:/[^'"]*)?['"])` +
      `|(require\\(\\s*['"]${moduleName}(?:/[^'"]*)?['"]\\s*\\))`,
  );
  return files.filter((file) => importRegex.test(readFileSync(file, 'utf8')));
}

describe('kernel import boundary for the database layer', () => {
  const allFiles = listTsFiles(KERNEL_SRC);

  it('only lets files under src/adapters/db/ import drizzle-orm', () => {
    const offenders = filesImporting('drizzle-orm', allFiles).filter(
      (file) => !isUnderAllowedDir(file),
    );
    expect(offenders).toEqual([]);
  });

  it('only lets files under src/adapters/db/ import pg', () => {
    const offenders = filesImporting('pg', allFiles).filter((file) => !isUnderAllowedDir(file));
    expect(offenders).toEqual([]);
  });
});

describe('database adapter module', () => {
  it('exposes a createDatabase factory that modules can use to open a pool', async () => {
    const mod = await import('./database');
    expect(typeof mod.createDatabase).toBe('function');
  });
});
