---
id: T-011
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-002]
---

## Goal

Every change can be audited, and modules read settings they declared.

## Acceptance

- [ ] `audit.record(tx, { record, recordId, action, before, after })` writes to `kernel.audit_log` in the caller's transaction with actor, company and correlation from context.
- [ ] Audit rows can't be updated or deleted by the application user (database rule or trigger).
- [ ] `settings.get(key, companyId)` returns the company's value or the manifest default; unknown keys throw.
- [ ] `settings.set` validates the value against the declared type and is audited.

## Change spec

src/audit/_, src/settings/_, migration 0003_audit_settings.sql.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-011
