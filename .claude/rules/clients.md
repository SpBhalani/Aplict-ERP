---
paths:
  - 'clients/**'
---

# Working in a client package

- Client code customises through extension points only: hooks, replaceable
  rules, event listeners, extra records and fields, UI slots, adapters.
- Never import a module's internals. Use @platform/contracts, @platform/kernel
  and the extension points each module exports from its public API.
- If what the client needs has no extension point, stop: the plan needs a
  module task that adds the extension point first.
- Never copy core code into the client package to change it.
- Configuration first: settings, custom fields, workflow states and
  templates before code. Code only when configuration can't do it.
- client.json must name a provider for every required capability of the
  client's enabled modules that no enabled module provides.
- Adapters translate the client system's names, units and errors into ours
  inside the adapter; nothing of theirs leaks out.
- Every adapter passes the shared contract test for its capability.
- Read docs/architecture/07-custom-code.md if unsure.
