---
id: T-006
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-003]
---

## Goal

A module describes itself in one runtime entry; the loader assembles a client's
instance from client.json and refuses invalid setups. (D6, D7)

## Acceptance

- [ ] `definePlatformModule({ manifest, nestModule, schema, providers, fallbacks, handlers, migrationsDir })` validates that providers match `manifest.provides`, handlers match `manifest.subscribes`, and fallbacks cover every required capability.
- [ ] `loadClient(name, resolveModule)` reads clients/<name>/client.json and returns modules, migrations list, capability registry, subscriber map and UI registrations.
- [ ] Provider choice: `own-module`, `fallback` or a listed adapter; with no choice, an enabled module's provider, else the requiring module's fallback.
- [ ] A required capability with no provider and no fallback throws an error naming the capability and the module that needs it.
- [ ] Removing a module from client.json: its providers and handlers disappear; requirers fall back; nothing else changes.
- [ ] Each module receives a module-scoped EventBus that only allows its declared events.
- [ ] Provider-validation rules live in the kernel and are exported for arch:check to reuse.

## Change spec

New: src/runtime.ts (definePlatformModule), src/loader/load-client.ts,
src/loader/provider-rules.ts, src/nest/platform.module.ts (DynamicModule
`PlatformModule.forClient`).
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-006
