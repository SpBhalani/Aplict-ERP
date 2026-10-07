# Platform: rules for every session

The full architecture is in docs/architecture/. Read only the chapter a task needs.
This file holds what every session must know.

## What this repo is

A modular monolith: a kernel, independent modules, and per-client packages.
TypeScript (strict), NestJS (Fastify), PostgreSQL, BullMQ on Redis,
React + Vite + Mantine. Nx + pnpm monorepo.

## Non-negotiable rules

1. The kernel never imports a module. Modules never import other modules;
   they use capabilities from @platform/contracts, events, and UI slots.
2. Import another package only through its public API (src/public-api.ts).
3. A module reads and writes only its own database schema. No cross-schema
   SQL, no foreign keys between modules.
4. Events go through the kernel EventBus (outbox). Never import bullmq
   outside packages/kernel/src/adapters/events/.
5. Every module has a valid manifest.ts. Every required capability has a fallback.
6. Contracts are versioned. Never change a published version; generate a new one.
7. Client code lives only in clients/<name>/ and uses extension points only.
8. Never edit locked tests (tests.lock.json), rules, gates, kernel or contracts.
   If a task seems to need it, stop and tell the human.
9. Create modules, capabilities, events, adapters, extension points and clients
   only with generators: pnpm nx g @platform/tools:<kind>.
10. Money exact (numeric or minor units), quantities with units, timestamptz,
    UUIDv7 ids, company_id on every business table.

## How we work

- One task at a time. The active task: tasks/ACTIVE. Its file: tasks/<id>-*.md.
  Stay inside its scope.
- Plan first. Tests before code. Locked tests define "done".
- Before you stop, update the task file: progress log and next step (/handoff).
- If an architecture question is unclear, stop and ask. Never invent a pattern.
- Use pnpm only. Never npm or yarn.

## Commands

- pnpm verify:quick lint, typecheck, tests, arch checks on changes
- pnpm nx test <project> one project's tests (e.g. module-quotes)
- pnpm nx g @platform/tools:module --name=<x>
  (also: capability, event, adapter, extension-point, client)
- docs/module-map.md every module, capability and event: read this
  instead of exploring other modules

## Where things are

apps/{api,worker,web} packages/{kernel,contracts,modules/_} clients/_
tools/{platform-tools,arch-checks} docs/{architecture,adr,specs} tasks/
