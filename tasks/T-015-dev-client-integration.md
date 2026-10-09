---
id: T-015
feature: kernel-foundation
package: clients/dev
scope:
  - clients/dev/
status: planned
depends_on: [T-007, T-009, T-013, T-014]
---

## Goal

A `dev` client for local work, and the integration tests that prove the foundation.

## Acceptance

- [ ] `clients/dev/client.json` enables example-a and example-b.
- [ ] `pnpm dev` starts Docker services, api, worker and web with CLIENT=dev; README section explains it.
- [ ] Integration tests 1 to 6 from the plan pass in CI.
- [ ] A seed script creates a dev company and admin user.

## Change spec

clients/dev, root `dev` script (gates change: root package.json, done by owner).
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-015
