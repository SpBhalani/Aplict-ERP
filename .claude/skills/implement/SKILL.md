---
name: implement
description: Implement the active task until its locked tests and all checks pass. Use only after tests are locked.
disable-model-invocation: true
---

# Implement the active task

1. Read tasks/ACTIVE and the task file it points to. If its status is not
   tests-locked, stop and tell the human.
2. Read the task's spec, the module's manifest.ts and the locked tests.
   Read nothing else yet.
3. In plan mode, propose: files to change or create, generators to run,
   order of work. Wait for approval.
4. Delegate the work to the implementer subagent with the approved plan.
5. When it returns, run /verify. If anything fails, send the failures back
   to the implementer. Repeat until clean.
6. Run /review-arch. Fix every FAIL through the implementer.
7. Update the task file: status -> review, progress log, next step
   ("open PR").
8. Stage the changes and propose a Conventional Commit message. Do not push.
