---
id: T-001
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: []
---

## Goal

The kernel reads and validates its configuration, knows who and which company
each piece of work is for, and generates UUIDv7 IDs. (ADR-0002 D8, D10)

## Acceptance

- [ ] `loadConfig(env)` returns typed settings for DATABASE_URL, REDIS_URL, CLIENT, PORT, JWT_SECRET, LOG_LEVEL with defaults for PORT (3000) and LOG_LEVEL (info).
- [ ] Missing or invalid settings throw one error listing every bad key; secrets are never printed.
- [ ] `runWithContext(ctx, fn)` and `currentContext()` carry companyId, actor, correlationId across awaits.
- [ ] `currentContext()` outside a context throws a clear error; `tryCurrentContext()` returns undefined.
- [ ] `newId()` returns a UUIDv7; 1,000 IDs generated in a row sort in creation order.
- [ ] All exported from `src/public-api.ts`.

## Change spec

New files in packages/kernel/src: config.ts, context.ts, ids.ts. Dependency: uuid.
Approved by: smit, 9-oct-26.

## Decisions

- 2026-10-09: Old locked tests were rewritten instead of restored (human chose
  "rewrite and re-lock"); human cleared their tests.lock.json entries.

## Progress log

- 2026-10-09: Human cleared the old T-001 lock entries. Tests rewritten (not locked)
  in packages/kernel/src: config.test.ts, context.test.ts, ids.test.ts,
  public-api.test.ts. Run: config/context/ids suites fail on missing ./config,
  ./context, ./ids; 5 public-api cases fail on assertions; 12 existing tests pass.
  Every acceptance point has a test.
- Assumptions to confirm: env key names kept (cfg.PORT number); PORT 1-65535;
  LOG_LEVEL in fatal|error|warn|info|debug|trace; empty = missing; DATABASE_URL and
  REDIS_URL must be URLs (not in spec); JWT_SECRET >= 32 chars (not in spec);
  newId monotonic within one ms.
- 2026-10-09: stop-verify.mjs blocks stopping while these expected failures exist;
  left as is (hooks are protected; needs a human fix to allow the test-first step).

## Next step

human: review tests, then pnpm tests:lock kernel
