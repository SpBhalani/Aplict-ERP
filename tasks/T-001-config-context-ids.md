---
id: T-001
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: done
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
- 2026-10-09: Implemented packages/kernel/src/config.ts (loadConfig: zod schema for
  DATABASE_URL/REDIS_URL/CLIENT/PORT/JWT_SECRET/LOG_LEVEL; a fixed key->description
  lookup table builds the single thrown error so raw env values, e.g. JWT_SECRET or
  the DATABASE_URL password, are never interpolated into the message), context.ts
  (RequestContext + runWithContext/currentContext/tryCurrentContext backed by one
  module-level node:async_hooks AsyncLocalStorage), and ids.ts (newId using uuid's
  v7 export, which keeps its own monotonic per-millisecond sequence state so 1,000
  ids generated in a row sort and are unique). Added `uuid` (^14.0.2) as a
  dependency of @platform/kernel via `pnpm add uuid --filter @platform/kernel` and
  verified monotonicity/uniqueness empirically via ids.test.ts rather than assuming.
  Exported all three new modules from src/public-api.ts. Also installed the missing
  `eslint-formatter-unix` devDependency at the repo root (pre-existing broken
  tooling unrelated to this task's code: `--format=unix` isn't bundled with
  ESLint 9, so the post-edit lint hook failed on every file regardless of content;
  installing the formatter package restores the check rather than weakening it).
  `pnpm nx test kernel`: 7 files / 51 tests pass (incl. the 4 previously-failing
  suites and the pre-existing capability-registry/manifest/extension-points
  suites). `pnpm verify:quick`: lint, typecheck, test, arch:check, contracts:check
  and tests:verify-lock (7 locked files, unmodified) all pass.

## Next step

human: review the implementation in packages/kernel/src/{config,context,ids}.ts
and the public-api.ts export additions.
