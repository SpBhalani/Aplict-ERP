---
id: T-003
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-002]
---

## Goal

Apply kernel and module migrations safely, in order, once. (D3)

## Acceptance

- [ ] `migrate(db, [{ module, schema, dir }])` creates each schema if missing, then applies its `NNNN_*.sql` files in numeric order, each in its own transaction.
- [ ] Applied files are recorded in `kernel.schema_migrations` with checksum; running again applies nothing.
- [ ] A changed checksum on an applied file stops with an error naming module and file.
- [ ] A failing file rolls back only that file, stops, and names the file and SQL error.
- [ ] Two concurrent `migrate` calls on one database: one waits (advisory lock); each file is applied once.
- [ ] Kernel's own migrations (schema_migrations, outbox, processed_events) run first.
- [ ] A module not in the list is never touched, and nothing is ever dropped.

## Change spec

New: src/adapters/db/migrate.ts, packages/kernel/migrations/0001_kernel.sql.
Approved by: smit, 9-oct-26.

## Decisions

## Progress log

## Next step

/write-tests T-003
