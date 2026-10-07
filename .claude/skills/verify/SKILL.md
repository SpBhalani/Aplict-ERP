---
name: verify
description: Run the project's checks on what changed and summarise failures briefly. Use any time, and before saying a task is done.
---

# Verify

1. Run: pnpm -s verify:quick
2. If it passes, say "All checks pass" and nothing else.
3. If it fails, report at most 10 lines: for each failure, the check
   (lint, typecheck, test, arch, contracts, tests-lock), file:line and a
   one-line cause. Never paste full logs.
4. Do not fix anything unless you were asked to.
