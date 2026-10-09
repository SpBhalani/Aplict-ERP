---
id: T-009
feature: kernel-foundation
package: apps/api
scope:
  - apps/api/
  - apps/worker/
status: planned
depends_on: [T-006, T-005]
---

## Goal

api and worker start a real instance for the client named in CLIENT.

## Acceptance

- [ ] api: loads config, runs migrations, builds `PlatformModule.forClient(CLIENT)`, serves on PORT.
- [ ] `/health` returns `{ status, database, redis, client, modules }`; status is "degraded" (HTTP 503) if database or Redis is down.
- [ ] Every request gets a correlation ID (from `x-correlation-id` or new) and runs inside a request context.
- [ ] worker: same client, runs the relay loop and consumers for enabled modules' handlers; stops cleanly on SIGTERM (finishes current jobs).
- [ ] Invalid config or unprovided capability: process exits with code 1 and one clear log line.

## Change spec

apps/api/src (main.ts, app.module.ts, health), apps/worker/src/main.ts.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-009
