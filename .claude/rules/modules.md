---
paths:
  - 'packages/modules/**'
---

# Working inside a module

- Open this module's manifest.ts before changing anything.
- Layers: domain -> application -> ports -> adapters. Imports point inwards only.
- domain/ and application/ import no NestJS, database, queue or HTTP libraries.
- Business logic talks only to ports (interfaces in ports/).
- Other modules are reached only through capabilities in @platform/contracts.
  Never import from another module, not even its types.
- Export only through src/public-api.ts.
- New capability, event, adapter or extension point: run the generator,
  then update manifest.ts. Never hand-write these.
- Every required capability in manifest.requires has a fallback.
- Tables live in this module's schema only. Store other modules' records by ID.
- Publish events only via the kernel EventBus, inside the same transaction as
  the change (outbox).
- Every listener is idempotent: check processed_events before acting.
- Read docs/architecture/03-inside-a-module.md if anything here is unclear.
