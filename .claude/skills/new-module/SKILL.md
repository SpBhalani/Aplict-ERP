---
name: new-module
description: Spec and scaffold a brand-new module. Use when a planned task creates a module.
disable-model-invocation: true
---

# Create a new module

Input: module name (kebab-case): $ARGUMENTS

1. Read tasks/ACTIVE and its task file. The scope must include
   packages/modules/$ARGUMENTS/. If not, stop.
2. Check docs/module-map.md: if a module with this name or the same purpose
   exists, stop and tell the human.
3. Delegate to the spec-writer subagent: write
   docs/specs/<feature>/$ARGUMENTS.spec.md from
   docs/specs/_templates/module.spec.md.
4. Show the human the spec's Provides, Requires (with fallbacks), Publishes,
   Subscribes and Open questions. Stop for approval.
5. After approval, run:
   pnpm nx g @platform/tools:module --name=$ARGUMENTS --no-interactive
6. Fill manifest.ts from the approved spec. Do not write business logic.
7. Run pnpm module-map, then pnpm verify:quick. Fix scaffold issues only.
8. Update the task file: status -> specced, progress log, next step
   ("/write-tests <task>").
9. Stage and propose: feat($ARGUMENTS): scaffold module
