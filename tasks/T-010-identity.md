---
id: T-010
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-009]
---

## Goal

Users log in, and permissions from manifests are enforced. (D9)

## Acceptance

- [ ] Kernel migration adds users, roles, role_permissions, user_roles, refresh_tokens (company_id on each).
- [ ] Login with email and password returns an access token (15 min) and refresh token (30 days, stored hashed); wrong password and unknown email give the same error.
- [ ] Refresh rotates the refresh token; a reused old refresh token revokes the whole chain.
- [ ] `@RequirePermission('x.y')` allows only users with a role holding it; unknown permission names fail at start-up.
- [ ] Available permissions are exactly those in enabled modules' manifests plus kernel ones.
- [ ] A seed command creates a first admin user for a company.
- [ ] Passwords hashed with argon2id; never logged.

## Change spec

src/identity/*, migration 0002_identity.sql. Dependencies: argon2, jose.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-010
