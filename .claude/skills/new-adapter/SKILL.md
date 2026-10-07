---
name: new-adapter
description: Create an adapter that provides an existing capability from another system. Use when a client keeps its own system for an area.
disable-model-invocation: true
---

# Create an adapter

Input: "<capability> <target> <client-or-module>", e.g. "stock.checkLevel erp client-a": $ARGUMENTS

1. Confirm the capability exists in docs/module-map.md and note its version.
   If it doesn't exist, stop: a contract task is needed first.
2. Confirm the active task's scope is the package that will hold the adapter.
   If not, stop.
3. Ask the human for the target system's API details or sample responses
   if they're not in the task file. Don't guess field names.
4. Run: pnpm nx g @platform/tools:adapter --capability=<capability> --target=<target> --project=<name> --kind=client --no-interactive
   (use --kind=module for an adapter inside a module)
5. Add real cases to the generated contract test, with a fake target client.
6. Implement the translation: their names and units into ours, inside the
   adapter only. Turn their errors and timeouts into our typed errors.
7. Run the contract test and pnpm verify:quick until green.
8. For a client, add the adapter to client.json (the generator printed the line).
9. Update the task file and stage changes.
