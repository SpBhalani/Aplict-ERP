---
id: T-002
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-001]
---

## Goal

One connection pool per instance, and a transaction helper that gives modules a
Drizzle handle and a TransactionHandle the EventBus can write into. (D1, D2)

## Acceptance

- [ ] `createDatabase(config)` opens a pg pool; `close()` ends it.
- [ ] `db.transaction(async (tx) => ...)` commits on success and rolls back on any thrown error.
- [ ] Nested `transaction` calls reuse the outer transaction instead of opening a second one.
- [ ] The `tx` passed in satisfies the kernel `TransactionHandle` port and exposes the Drizzle handle to adapters.
- [ ] `db.ping()` returns true when the database answers, false (not throw) when it doesn't, within 2 s.
- [ ] Only files under src/adapters/db/ import drizzle-orm or pg.
- [ ] Tests run against real PostgreSQL via Testcontainers.

## Change spec

New: src/adapters/db/database.ts, src/ports/database.port.ts. Dependencies:
drizzle-orm, pg, @types/pg; dev: testcontainers, @testcontainers/postgresql.
Adds an `integration-test` style test file naming (`*.int.test.ts`).
Approved by: Smit, 9-oct-26.

## Decisions

## Progress log

## Next step

/write-tests T-002
