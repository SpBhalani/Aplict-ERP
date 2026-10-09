# ADR-0002: Kernel foundation design

Status: proposed
Date: 2026-10-08

## Problem

The kernel needs a database layer, migrations, a reliable event bus, a module
loader and basic identity before any business module can be built. These
choices are hard to change later, so they are recorded together.

## Decisions

### D1 · Database access: Drizzle ORM on node-postgres (`pg`)

Typed queries, schema-per-module through `pgSchema('<module>')`, SQL stays
visible. Only `packages/kernel/src/adapters/db/` and modules' `src/adapters/db/`
import `drizzle-orm` or `pg` (already enforced for domain/ and application/).

### D2 · One database per client, one schema per module

The kernel owns schema `kernel`. Each enabled module owns a schema named after
it (kebab -> snake). One application database user to start; per-module
database roles are a later hardening step (the static `arch:check` schema scan
already blocks cross-schema SQL).

### D3 · Migrations: SQL files per module, applied by our own runner

- Each module keeps numbered SQL files in `migrations/` (`0001_create_x.sql`),
  generated with `drizzle-kit generate` or written by hand.
- A kernel runner applies, in order: kernel migrations, then each enabled
  module's, inside a transaction per file, recording
  `(module, file, checksum, applied_at)` in `kernel.schema_migrations`.
- It refuses to start if an applied file's checksum changed ("never edit a
  migration that has run").
- It creates the module's schema before its first migration. Removing a module
  leaves its schema untouched (archived), never dropped.
- A Postgres advisory lock stops two api copies migrating at once.

### D4 · Outbox: one `kernel.outbox` table, written in the module's transaction

- `EventBus.publish(tx, contract, data, ctx)` validates `data` against the
  event contract's Zod schema and inserts one row into `kernel.outbox` using
  the caller's transaction. Modules never touch the table themselves.
- Row: id (UUIDv7), type, version, company_id, actor, correlation_id,
  payload jsonb, occurred_at, published_at (null until relayed).

### D5 · Relay and delivery: poll the outbox, fan out to BullMQ

- The relay (runs in `worker`) selects unpublished rows with
  `FOR UPDATE SKIP LOCKED LIMIT 100` every 500 ms, enqueues one BullMQ job per
  subscriber on queue `events.<subscriber-module>` with job id
  `<event-id>:<subscriber>`, then marks rows published.
  Duplicate job ids are ignored by BullMQ, so re-relaying is harmless.
- Consumers run in `worker`. Each handler runs inside the subscriber's
  transaction, which first inserts `(subscriber, event_id)` into
  `kernel.processed_events`; a conflict means "already handled": skip.
- Retries: 8 attempts, exponential backoff from 1 s. After that the job stays
  in BullMQ's failed set (the holding area) and an error is logged.
- Payloads are validated against the contract again on the consumer side.

### D6 · Module runtime entry

Every module exports, from `src/runtime.ts`, `definePlatformModule({...})` with:
its manifest, its NestJS module class, its database schema object, the
capability providers it offers, the fallbacks for capabilities it requires,
and its event handlers keyed by `event@vN`. The loader imports
`@platform/module-<name>/runtime`. Fallbacks live with the module that needs
them, because only it knows how to cope without the capability.

### D7 · Module loader

- Reads `CLIENT` from the environment, then `clients/<CLIENT>/client.json`.
- Loads each enabled module's runtime entry; validates manifests and the
  provider choice with the same rules as `arch:check` (shared code moves into
  the kernel so both use one implementation).
- Builds the capability registry: chosen provider per capability, else the
  requiring module's fallback; refuses to start if any required capability is
  unprovided, naming it.
- Registers modules as NestJS modules in `api`, and their event handlers in `worker`.

### D8 · Request context

`AsyncLocalStorage` carries `{ companyId, actor, correlationId }` for every
HTTP request and every event handler. EventBus and audit read it by default.

### D9 · Identity (built-in first)

Kernel tables: users, roles, role_permissions, user_roles, sessions.
Passwords hashed with argon2id. Short-lived signed access tokens (JWT) plus
refresh tokens stored hashed. Permissions come only from manifests; a NestJS
guard enforces `@RequirePermission('<module>.<action>')`. Built on standard
token shapes so Keycloak (OIDC) can replace the login part later.

### D10 · Configuration

All environment settings are parsed with one Zod schema at start-up
(`DATABASE_URL`, `REDIS_URL`, `CLIENT`, `PORT`, `JWT_SECRET`, `LOG_LEVEL`).
Invalid or missing settings stop the app with a clear message.

### D11 · Test harness

`@platform/kernel/testing` starts PostgreSQL and Redis with Testcontainers once
per test file, boots the kernel with chosen modules in-process, and offers
`drainEvents()`, which runs relay and delivery synchronously until the outbox
and queues are empty, so cross-module tests are deterministic.

## Consequences

- New dependencies: drizzle-orm, drizzle-kit, pg, bullmq, ioredis, argon2,
  jose (JWT), uuid (v7), testcontainers, @testcontainers/postgresql.
- Gates changes (owner): module generator adds `src/runtime.ts`,
  `src/adapters/db/schema.ts` and a first migration; `arch:check` validates the
  runtime entry; a new `integration-test` target runs Testcontainers tests;
  provider-validation logic moves into the kernel.
- CI needs Docker for integration tests (GitHub's ubuntu runners have it).
