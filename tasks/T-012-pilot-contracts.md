---
id: T-012
feature: kernel-foundation
package: packages/contracts
scope:
  - packages/contracts/
status: planned
depends_on: []
---

## Goal

Two tiny contracts that let the pilots exercise every channel.

## Acceptance

- [ ] Capability `pilot.ping@v1`: input `{ companyId, message }`, output `{ reply, answeredBy }`.
- [ ] Event `example-a.pong-sent@v1`: payload `{ pingId, message }`.
- [ ] Created with generators; `pnpm contracts:snapshot` run by the human.

## Change spec

Generated files only.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

Generators, then human runs pnpm contracts:snapshot.
