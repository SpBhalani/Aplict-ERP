# Architecture review checklist

Used by the arch-reviewer subagent, the Claude review job in CI, and humans.

## Boundaries

- [ ] No module imports another module (only @platform/contracts and @platform/kernel)
- [ ] Cross-package imports go through src/public-api.ts only
- [ ] Kernel code contains no business rules and imports no module
- [ ] Client code uses extension points only

## Inside a module

- [ ] domain/ and application/ import no framework, database or queue libraries
- [ ] Business logic uses ports, not concrete adapters
- [ ] manifest.ts declares everything the module provides, needs, sends and hears
- [ ] Every required capability has a fallback

## Data

- [ ] Only this module's schema is touched; no cross-module foreign keys
- [ ] Money exact, quantities with units, timestamptz, UUIDv7, company_id
- [ ] New migrations only; none edited after running

## Events and contracts

- [ ] Events published through the EventBus in the same transaction (outbox)
- [ ] Listeners are idempotent
- [ ] No published contract changed without a new version

## Tests

- [ ] Every acceptance point has a test; locked tests unchanged
- [ ] New behaviour has new tests; no .only or .skip; every test asserts something
