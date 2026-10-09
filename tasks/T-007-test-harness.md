---
id: T-007
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-005, T-006]
---

## Goal

Any package can test the kernel plus chosen modules against real PostgreSQL and
Redis, deterministically. (D11)

## Acceptance

- [ ] `startTestInfra()` starts PostgreSQL and Redis containers once per test file and returns URLs; `stop()` removes them.
- [ ] `createTestPlatform({ modules, client })` migrates, builds the registry and returns `{ capability(contract), publishInTx, drainEvents, db, close }`.
- [ ] `drainEvents()` runs relay and consumers until outbox and queues are empty, then resolves; it fails with the stuck event if a job is still failing after its retries.
- [ ] Each test file gets a fresh database, so tests don't leak into each other.
- [ ] Exported as `@platform/kernel/testing`, never imported by production code (lint rule).

## Change spec

New: src/testing/*. package.json exports "./testing". Lint restriction on
importing it outside test files is a gates change in T-008.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-007
