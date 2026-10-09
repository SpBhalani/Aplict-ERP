---
id: T-008
feature: kernel-foundation
package: tools
scope:
  - tools/
  - eslint.config.mjs
status: planned
depends_on: [T-006]
---

## Goal

Generators and checks know about the module runtime entry, database schema and
integration tests. Gates change: done by the owner.

## Acceptance

- [ ] Module generator also creates src/runtime.ts (definePlatformModule), src/adapters/db/schema.ts (`pgSchema('<schema>')`), migrations/0001_init.sql and a `*.int.test.ts` skeleton.
- [ ] Client generator writes client.json the loader accepts.
- [ ] arch:check: every module has src/runtime.ts; providers check reuses the kernel's provider rules.
- [ ] New Nx target `integration-test` (vitest on `*.int.test.ts`) on modules, clients and kernel; CI runs it on affected projects.
- [ ] Lint: `@platform/kernel/testing` importable only from test files.
- [ ] Generator tests updated; `pnpm -s hooks:test` still passes.

## Change spec

tools/platform-tools templates and tests, tools/arch-checks, eslint.config.mjs,
nx.json, .github/workflows/ci.yml.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

Owner edits tools/ (session: claude --setting-sources user).
