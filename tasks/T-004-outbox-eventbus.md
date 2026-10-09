---
id: T-004
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-003]
---

## Goal

Modules publish events inside their own transaction through the EventBus port. (D4)

## Acceptance

- [ ] `publish(tx, contract, data, ctx?)` inserts one `kernel.outbox` row in the caller's transaction; ctx defaults to the current request context.
- [ ] If the caller's transaction rolls back, no outbox row exists.
- [ ] Data that fails the event contract's schema throws before anything is written.
- [ ] Publishing an event the module did not declare in `manifest.publishes` throws (checked through the module-scoped bus the loader hands each module).
- [ ] Row has UUIDv7 id, type, version, company_id, actor, correlation_id, payload, occurred_at, published_at null.

## Change spec

New: src/adapters/events/outbox-event-bus.ts. Updates EventBus port if needed (additive only).
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-004
