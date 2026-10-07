---
paths:
  - 'packages/contracts/**'
---

# Working in contracts

- You are here only in a contract task the human started. If tasks/ACTIVE
  scope doesn't include packages/contracts/, stop.
- Create capabilities and events only with the generators:
  pnpm nx g @platform/tools:capability --name=<area.question>
  pnpm nx g @platform/tools:event --name=<module.something-happened>
- Every contract is a Zod schema plus a version number. TypeScript types are
  inferred from the schema, never written separately.
- A published version is frozen. Removing, renaming or retyping a field
  means a new version (v2) beside v1. pnpm contracts:check enforces this.
- Capabilities are named for the business question (stock.checkLevel), never
  after a module. Events are past tense (quote.revision-approved).
- Event payloads carry IDs and the few fields listeners need, not whole records.
- Contracts import nothing except zod and other contracts.
- New contracts are frozen by the human with pnpm contracts:snapshot.
