---
name: write-tests
description: Write the failing tests that define done for a task. Use after its spec is approved, before any implementation.
disable-model-invocation: true
---

# Write tests for a task

Input: task id: $ARGUMENTS

1. Read tasks/ACTIVE; it must match $ARGUMENTS. Read the task file.
2. The spec must be approved (module spec, or the Change spec section with
   "Approved by"). If not, stop.
3. Delegate to the test-writer subagent with: the task file, the spec,
   the module's manifest.ts and .claude/rules/tests.md.
4. When it returns, run the new tests. They must fail because behaviour is
   missing, not because of syntax or import errors. Fix only those errors.
5. Show the human the acceptance-point -> test-name table and any
   acceptance point without a test.
6. Update the task file: progress log, next step
   ("human: review tests, then pnpm tests:lock <project>").
7. Stop. Do not lock the tests and do not start implementing.
