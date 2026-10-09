# Feature brief: Kernel foundation

## Problem

Part 1 built the walls and gates, but nothing connects to a database, events
can't travel, and modules can't be loaded per client. No business module can
be built or tested together with another until this plumbing exists.

## Who uses it

Every engineer and every module. No end user sees it directly, except login.

## What "done" looks like

- `pnpm dev` starts PostgreSQL, Redis, api, worker and web locally for a
  chosen client, and the api answers `/health` with database and Redis status.
- A module declares its tables, migrations, capabilities, fallbacks and event
  listeners; the kernel creates its schema, runs its migrations and wires it in.
- A module saves a change and publishes an event in one transaction; another
  module receives it once, even if delivery is retried.
- Removing a module from a client's `client.json` still starts the app,
  using fallbacks, with no code change in other modules.
- A test can boot the kernel plus chosen modules against a real PostgreSQL and
  Redis (Testcontainers) and run a cross-module flow deterministically.
- Users log in; every request knows its company, user and correlation ID;
  permissions declared in manifests are enforced; changes are audited.

## Out of scope (later kernel phases, planned when a feature needs them)

Workflow and approvals engine, custom-field definitions, numbering series,
files and PDF generation, notifications, scheduled jobs beyond the relay,
process manager (sagas), API keys and rate limits, single sign-on, the UI
shell's routing and login screens beyond a minimal login page, production
deployment.

## Open questions

- Keycloak now, or built-in login first? (Plan assumes built-in first; ADR-0002.)
- Per-module database roles now, or later? (Plan assumes later; static checks cover it.)
