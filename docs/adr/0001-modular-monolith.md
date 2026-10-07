# ADR-0001: Modular monolith with capability contracts

Status: accepted
Date: 2026-10-07

## Problem

We build order-to-cash software for manufacturers, with custom code per client
and modules that can be removed or replaced per client. A small team starts
with 4 to 5 clients, each on its own instance.

## Options considered

1. **Classic monolith.** Fastest to start; boundaries erode and modules can't be removed.
2. **Microservices.** Strong isolation; many deployments per client, high operating cost for a small team.
3. **Modular monolith.** One application per client, strict internal boundaries, capability contracts and events between modules.

## Decision

Option 3. Modules depend on capabilities, never on each other; each owns its
schema; events go through an outbox; client code plugs into extension points.
Boundaries are enforced by lint rules, architecture checks and CI.

## Consequences

- Nx tags and `@nx/enforce-module-boundaries` encode the dependency rules.
- `pnpm arch:check` validates manifests, providers, schemas and data types.
- A module can later be split into its own service if it ever needs to scale alone.
