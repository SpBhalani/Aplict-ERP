import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, type PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { newId } from '../../ids';
import type { DatabaseConfig, DatabasePort, DbTransactionHandle } from '../../ports/database.port';

const PING_TIMEOUT_MS = 1_900;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * One pg pool per instance. transaction() tracks the current transaction in
 * AsyncLocalStorage so a nested call reuses the same client/BEGIN instead of
 * opening a second one (handbook ch.6 rule 8: one transaction, never two).
 */
export function createDatabase(config: DatabaseConfig): DatabasePort {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: PING_TIMEOUT_MS - 100,
  });
  const context = new AsyncLocalStorage<DbTransactionHandle>();

  async function beginTransaction<T>(fn: (tx: DbTransactionHandle) => Promise<T>): Promise<T> {
    const client: PoolClient = await pool.connect();
    const tx: DbTransactionHandle = { id: newId(), db: drizzle(client) };
    try {
      await client.query('BEGIN');
      const result = await context.run(tx, () => fn(tx));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    transaction(fn) {
      const current = context.getStore();
      return current ? fn(current) : beginTransaction(fn);
    },
    async ping() {
      try {
        await withTimeout(pool.query('select 1'), PING_TIMEOUT_MS);
        return true;
      } catch {
        return false;
      }
    },
    async close() {
      await pool.end();
    },
  };
}
