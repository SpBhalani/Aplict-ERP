---
name: handoff
description: Save the task's progress and next step so a fresh session can continue. Use before ending a session or when context is getting full.
---

# Hand off

1. Read tasks/ACTIVE and its task file.
2. Append to Progress log, one line each, at most 5 lines: what was done
   this session, in past tense, with file names where useful.
3. Add any decision made this session to Decisions, with its reason.
4. Replace Next step with the single exact next action, written so a
   fresh session can start without this conversation.
5. Update status if it changed.
6. Say: "Saved. Safe to /clear." Nothing else.
