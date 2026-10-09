---
id: T-002
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: tests-locked
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

- 2026-10-09: Wrote failing tests via test-writer subagent:
  `packages/kernel/src/adapters/db/database.test.ts` (fast, import-boundary +
  factory existence, no DB) and `database.int.test.ts` (Testcontainers,
  covers pool lifecycle, commit/rollback, nested-transaction reuse,
  TransactionHandle shape, ping true/false/timeout). No implementation or
  port file written. Installed the approved deps (`drizzle-orm`, `pg`,
  dev: `@types/pg`, `testcontainers`, `@testcontainers/postgresql`) into
  packages/kernel/package.json so the suite fails on the missing
  `./database` module instead of a missing package. `pnpm nx test kernel`:
  2 failing test files (both failing on `Cannot find module './database'`),
  7 locked suites / 53 tests still passing untouched.
- 2026-10-09: stop-verify hook blocked on TS2307/TS7006 compile errors in
  `database.int.test.ts` (no types to resolve `tx`, `DatabasePort`, etc).
  Added minimal type-only `src/ports/database.port.ts` (DatabasePort,
  DbTransactionHandle, DatabaseConfig — no drizzle-orm import, so the
  import-boundary test stays correct) and a `createDatabase` stub in
  `src/adapters/db/database.ts` that throws "not implemented". This is
  scaffolding only, not the real implementation: lint and typecheck are
  now green, and the int-test suite correctly fails on the thrown
  "not implemented" error instead of a missing-module/type error.
  Known gap: `.claude/hooks/stop-verify.mjs` runs `pnpm verify:quick`,
  which includes `nx affected -t test` — this will keep failing (by
  design, since these tests define behaviour /implement hasn't written
  yet) until T-002 is implemented. Human decided to stop here anyway and
  handle the hook's nagging manually rather than jump to /implement now.

## Next step

human: review tests, then pnpm tests:lock kernel (note: stop-verify hook
will keep blocking on the failing kernel tests until T-002 is implemented
— expected, since these tests define what /implement still has to build)
