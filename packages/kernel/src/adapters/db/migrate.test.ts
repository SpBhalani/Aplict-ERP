import { describe, expect, it } from 'vitest';
import { assertIdentifier } from './migrate';

/**
 * Fast, no-database tests for migrate.ts's identifier guard (T-003).
 *
 * module/schema names become raw SQL identifiers (CREATE SCHEMA "<schema>")
 * since Postgres can't parameterize identifiers, so assertIdentifier is the
 * only thing standing between a module manifest and SQL injection. The
 * Testcontainers suite (migrate.int.test.ts) only exercises valid names, so
 * this covers the rejection path without needing a live database.
 */
describe('assertIdentifier', () => {
  it('accepts a lowercase kebab-case identifier', () => {
    expect(() => assertIdentifier('module', 'sample-module')).not.toThrow();
  });

  it('accepts a lowercase snake_case identifier', () => {
    expect(() => assertIdentifier('schema', 'sample_schema')).not.toThrow();
  });

  it('rejects an identifier that does not start with a lowercase letter', () => {
    expect(() => assertIdentifier('module', '1sample')).toThrow(/invalid module identifier/);
  });

  it('rejects an identifier containing characters that cannot appear in a bare SQL identifier', () => {
    expect(() => assertIdentifier('schema', 'bad"; drop table kernel.outbox; --')).toThrow(
      /invalid schema identifier/,
    );
  });
});
