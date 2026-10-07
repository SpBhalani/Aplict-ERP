---
name: plan-feature
description: Break a feature brief into small single-package tasks. Use at the start of every feature.
disable-model-invocation: true
---

# Plan a feature

Input: path to a brief: $ARGUMENTS

## Phase 1: propose (write nothing)

1. Read the brief, docs/module-map.md, and only the architecture chapters
   the brief touches. Do not open module source code.
2. Propose, in this order:
   - Modules affected (existing / new)
   - New capabilities, events, extension points (names only)
   - Kernel or contract changes: list under "Needs owner + ADR"
   - Tasks: id, title, single package, outcome, depends on
3. Check every task: one package? testable outcome? under a few hundred
   lines? If not, split it.
4. Stop and ask the human to approve or change the plan.

## Phase 2: write (after approval, in normal mode)

5. Write docs/specs/<feature>/plan.md from the approved proposal.
6. For each task, copy tasks/_template.md to tasks/<id>-<slug>.md and fill
   Goal, package, scope, Acceptance and depends_on. Leave Change spec empty.
7. Output the list of task files and tell the human to start the first one
   with: pnpm task:start <id>
