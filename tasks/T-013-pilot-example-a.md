---
id: T-013
feature: kernel-foundation
package: packages/modules/example-a
scope:
  - packages/modules/example-a/
status: planned
depends_on: [T-008, T-012]
---

## Goal

A pilot module that provides `pilot.ping` and publishes `example-a.pong-sent`.

## Acceptance

- [ ] Provides `pilot.ping@v1`, passing the shared contract test; `answeredBy` is "example-a".
- [ ] Each ping is stored in its own schema table (UUIDv7, company_id, timestamptz) and publishes `pong-sent` in the same transaction.
- [ ] A failed save publishes nothing.

## Change spec

Generated module plus one table, one use case, one provider.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/new-module example-a
