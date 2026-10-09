---
id: T-003
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: review
depends_on: [T-002]
---

## Goal

Apply kernel and module migrations safely, in order, once. (D3)

## Acceptance

- [x] `migrate(db, [{ module, schema, dir }])` creates each schema if missing, then applies its `NNNN_*.sql` files in numeric order, each in its own transaction.
- [x] Applied files are recorded in `kernel.schema_migrations` with checksum; running again applies nothing.
- [x] A changed checksum on an applied file stops with an error naming module and file.
- [x] A failing file rolls back only that file, stops, and names the file and SQL error.
- [x] Two concurrent `migrate` calls on one database: one waits (advisory lock); each file is applied once.
- [x] Kernel's own migrations (schema_migrations, outbox, processed_events) run first.
- [x] A module not in the list is never touched, and nothing is ever dropped.

## Change spec

New: src/adapters/db/migrate.ts, packages/kernel/migrations/0001_kernel.sql.
Approved by: smit, 9-oct-26.

## Decisions

- `migrate(databaseUrl: string, modules: Array<{ module, schema, dir }>): Promise<void>`
  — `db` is a plain connection string, not the T-002 `DatabasePort`, because the
  runner needs an advisory lock and bare DDL (`CREATE SCHEMA`) outside any
  single transaction wrapper.
- Kernel's own migrations (`packages/kernel/migrations/0001_kernel.sql`) run
  automatically, first, on every call, recorded as `module = 'kernel'` —
  callers never pass it in `modules`.

## Progress log

- 2026-10-09: Tests written by test-writer subagent:
  `packages/kernel/src/adapters/db/migrate.int.test.ts` (Testcontainers
  PostgreSQL, 8 tests, no fakes — migrations are a real-database concern).
  Verified the suite fails only on `Cannot find module './migrate'` (missing
  implementation), not on a test-file error; all 9 previously-locked suites
  (64 tests) still pass unchanged.

  | Acceptance point                                                | Test name                                                                                                        |
  | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
  | Creates each schema if missing                                  | creates a module's schema before applying its first migration file                                               |
  | Applies `NNNN_*.sql` in numeric order, each its own transaction | applies a module's migration files in ascending numeric filename order so later files can depend on earlier ones |
  | Applied files recorded with checksum; re-run applies nothing    | records each applied file with a checksum so running migrate again applies nothing twice                         |
  | Changed checksum stops with error naming module+file            | stops with an error naming the module and file when a previously applied file's checksum has changed             |
  | Failing file rolls back only that file, names file+SQL error    | rolls back only the failing file, stops, and names the file and SQL error                                        |
  | Two concurrent calls: one waits, each file applied once         | lets a second concurrent migrate call wait on the advisory lock so each file is applied exactly once             |
  | Kernel's own migrations run first                               | always applies the kernel's own migrations before any module in the list                                         |
  | Module not in list is never touched, nothing dropped            | never touches or drops a module's schema when that module is left out of a later migrate call                    |

  No acceptance point is without a test.

- 2026-10-09: Implemented by the implementer subagent:
  `packages/kernel/src/adapters/db/migrate.ts` (raw `pg.Client`; advisory
  lock; `kernel.schema_migrations` bootstrapped in code so it exists before
  any file lookup; kernel module unconditionally prepended) and
  `packages/kernel/migrations/0001_kernel.sql` (creates `kernel.outbox` and
  `kernel.processed_events` per ADR-0002 D4/D5). All 8 locked tests pass; all
  previously-locked suites unchanged. `pnpm verify:quick` green.

- 2026-10-09: Found and fixed a stale lock entry unrelated to this
  implementation: `tests.lock.json`'s hash for `migrate.int.test.ts`,
  recorded in the original lock commit (`39dc36e`), didn't match the file's
  actual content (file itself was untouched — confirmed via `git diff`).
  Human re-ran `pnpm tests:lock kernel` (commit `5e6d0fa`), fixing it.

- 2026-10-10: `/review-arch` verdict: CLEAN, no FAILs. Resolved its three
  open items: (1) added `packages/kernel/src/adapters/db/migrate.test.ts`,
  a fast no-database unit test for `assertIdentifier`'s rejection path
  (exported from `migrate.ts` for this purpose only — not part of the public
  API); (2) exported `migrate`/`MigrationModule` from `public-api.ts` — no
  current caller, but `apps/api`/`apps/worker` can only reach kernel code
  through the public API (`package.json` `exports` restricts this), so this
  was needed before any later task wires it in; (3) this status update.
  `pnpm verify:quick` re-confirmed green (76 kernel tests, 11 suites).

## Next step

open PR
