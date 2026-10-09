import type { DatabaseConfig, DatabasePort } from '../../ports/database.port';

/**
 * Stub for T-002: gives the test suite a real module to import so it fails
 * on missing behaviour, not on a missing file. The pool, transaction and
 * ping logic are implemented by /implement, not by /write-tests.
 */
export function createDatabase(config: DatabaseConfig): DatabasePort {
  throw new Error(`createDatabase is not implemented yet (T-002): ${config.databaseUrl}`);
}
