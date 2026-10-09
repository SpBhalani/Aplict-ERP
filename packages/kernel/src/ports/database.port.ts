import type { TransactionHandle } from './event-bus.port';

/**
 * Minimal shape of the Drizzle handle exposed to adapters inside a
 * transaction. Kept free of a direct drizzle-orm import here so that only
 * src/adapters/db/ needs that dependency (handbook chapter 6 import boundary).
 */
export interface SqlHandle {
  execute(query: unknown): Promise<unknown>;
}

export interface DbTransactionHandle extends TransactionHandle {
  readonly db: SqlHandle;
}

export interface DatabaseConfig {
  databaseUrl: string;
}

/** One connection pool per instance; modules run work through transaction(). */
export interface DatabasePort {
  transaction<T>(fn: (tx: DbTransactionHandle) => Promise<T>): Promise<T>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}
