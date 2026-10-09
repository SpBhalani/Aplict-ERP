# Plan: Kernel foundation

Brief: `brief.md` · Design: `docs/adr/0002-kernel-foundation.md`

## Tasks and order

| Task  | Title                                                                    | Package                    | Kind          | Depends on                 |
| ----- | ------------------------------------------------------------------------ | -------------------------- | ------------- | -------------------------- |
| T-001 | Config, request context, IDs                                             | packages/kernel            | kernel        | —                          |
| T-002 | Database layer and transactions                                          | packages/kernel            | kernel        | T-001                      |
| T-003 | Migration runner                                                         | packages/kernel            | kernel        | T-002                      |
| T-004 | Outbox and EventBus adapter                                              | packages/kernel            | kernel        | T-003                      |
| T-005 | Relay, delivery and idempotent consumers                                 | packages/kernel            | kernel        | T-004                      |
| T-006 | Module runtime entry and loader                                          | packages/kernel            | kernel        | T-003                      |
| T-007 | Test harness (`@platform/kernel/testing`)                                | packages/kernel            | kernel        | T-005, T-006               |
| T-008 | Generator and arch-check updates                                         | tools/                     | gates (owner) | T-006                      |
| T-009 | Wire api and worker to the kernel                                        | apps/api, apps/worker      | app           | T-006, T-005               |
| T-010 | Identity: users, roles, login, permission guard                          | packages/kernel            | kernel        | T-009                      |
| T-011 | Audit log and settings service                                           | packages/kernel            | kernel        | T-002                      |
| T-012 | Pilot: `ping` capability and `pong` event                                | packages/contracts         | contract      | —                          |
| T-013 | Pilot module `example-a` (provides, publishes)                           | packages/modules/example-a | module        | T-008, T-012               |
| T-014 | Pilot module `example-b` (requires with fallback, subscribes, UI widget) | packages/modules/example-b | module        | T-008, T-012               |
| T-015 | `dev` client, local `pnpm dev`, cross-module integration tests           | clients/dev                | client        | T-007, T-009, T-013, T-014 |

T-001 to T-007 are one person's critical path. T-011 and T-012 can run in
parallel with it. The pilots (T-012 to T-015) exist to prove the foundation;
they are deleted or kept as reference once the first real module exists.

## How each kind of task runs

- **kernel / contract:** human starts `PLATFORM_ALLOW_PROTECTED=1 claude` after
  `pnpm task:start <id>`; PR needs the `architecture-change` label. ADR-0002
  covers all kernel tasks in this plan, so no new ADR per task.
- **gates (owner):** the owner edits `tools/` (Claude may help in a session
  started with `claude --setting-sources user`); PR label and ADR-0002.
- **app / module / client:** normal workflow from Playbook Part 2.

## What proves the foundation is done (T-015 integration tests)

1. Both pilot modules enabled: a request to example-b gets an answer from
   example-a's capability; example-a's event reaches example-b exactly once.
2. example-a removed from `client.json`: the app still starts, example-b's
   request is answered by its fallback, and its widget slot still renders.
3. The same event delivered twice changes nothing the second time.
4. A handler that fails three times then succeeds is retried and completes;
   one that always fails ends in the holding area without blocking others.
5. A required capability with no provider and no fallback stops start-up with
   an error naming the capability.
6. An edited, already-applied migration stops start-up.
