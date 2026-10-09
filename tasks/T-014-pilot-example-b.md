---
id: T-014
feature: kernel-foundation
package: packages/modules/example-b
scope:
  - packages/modules/example-b/
status: planned
depends_on: [T-008, T-012]
---

## Goal

A pilot module that needs `pilot.ping` (with a fallback), listens to
`pong-sent`, and shows a widget.

## Acceptance

- [ ] Requires `pilot.ping@v1` with a fallback answering `answeredBy: "fallback"`; the fallback passes the shared contract test.
- [ ] Subscribes to `example-a.pong-sent@v1` and counts pongs per company in its own table; a duplicate event leaves the count unchanged.
- [ ] Registers a widget in slot `dashboard.main`.

## Change spec

Generated module plus one table, one handler, one fallback, one widget.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/new-module example-b
