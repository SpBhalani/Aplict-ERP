---
name: review-arch
description: Review the current changes against the architecture checklist. Use before every commit.
---

# Architecture review

1. Delegate to the arch-reviewer subagent. Give it only: "review the
   current diff against docs/architecture/checklist.md".
2. Show its table and verdict unchanged.
3. If the verdict is CHANGES NEEDED, list the FAIL rows as a numbered
   to-do list and ask whether to fix them now.
4. Never mark an item as acceptable yourself; only the reviewer or the
   human can.
