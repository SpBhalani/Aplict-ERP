---
name: new-event
description: Add a new event a module publishes. Use when a module must announce something new.
disable-model-invocation: true
---

# Add an event

Input: event name in past tense, e.g. quote.revision-approved: $ARGUMENTS

1. Read tasks/ACTIVE. Events live in packages/contracts. If the scope
   doesn't include packages/contracts/, stop and tell the human:
   "this needs a contract task".
2. Check docs/module-map.md: if a similar event exists, stop and propose
   using it instead.
3. Propose the payload: IDs plus the few fields listeners need. No whole
   records. Stop for approval.
4. Run: pnpm nx g @platform/tools:event --name=$ARGUMENTS --no-interactive
5. Fill the Zod payload schema from the approved proposal.
6. Add it to the publishing module's manifest.publishes.
7. Run pnpm module-map and pnpm verify:quick.
8. Update the task file and stage changes. Tell the human to run
   pnpm contracts:snapshot, and that the PR needs the architecture-change
   label and a short ADR.
