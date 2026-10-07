---
name: adr
description: Draft an architecture decision record. Use when a rule, pattern, core library or kernel design needs to change.
disable-model-invocation: true
---

# Draft an ADR

Input: the decision's title: $ARGUMENTS

1. List docs/adr/ and take the next number (0001, 0002, ...).
2. Read the ADRs and architecture chapters this decision touches.
3. Copy docs/adr/_template.md to docs/adr/<NNNN>-<slug>.md.
4. Fill: Problem (with the concrete situation that raised it), at least two
   Options with trade-offs, a Recommendation, and Consequences listing every
   doc, rule, check and module that would change.
5. Status: proposed.
6. Stop. Never edit rules, checks, CLAUDE.md or docs/architecture/ yourself:
   the human decides and applies the change.
