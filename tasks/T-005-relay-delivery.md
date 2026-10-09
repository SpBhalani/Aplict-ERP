---
id: T-005
feature: kernel-foundation
package: packages/kernel
scope:
  - packages/kernel/
status: planned
depends_on: [T-004]
---

## Goal

Events reach every subscriber exactly once in effect, with retries and a holding area. (D5)

## Acceptance

- [ ] `relayOnce()` moves up to 100 unpublished rows to BullMQ, one job per subscriber, job id `<event-id>:<subscriber>`, and marks them published.
- [ ] Two relays running at once never enqueue the same row twice (SKIP LOCKED); re-enqueueing a job id is a no-op.
- [ ] A consumer runs the handler inside a transaction that first records `(subscriber, event_id)` in `kernel.processed_events`; a second delivery skips the handler.
- [ ] Handler error rolls back the handler's writes and the processed_events row; the job retries with exponential backoff, 8 attempts.
- [ ] After the last attempt the job remains in the failed set and an error is logged with event id and subscriber.
- [ ] A payload that no longer matches the contract fails the job without retrying.
- [ ] The handler runs inside a request context built from the event (companyId, actor, correlationId).
- [ ] Only src/adapters/events/ imports bullmq or ioredis.

## Change spec

New: src/adapters/events/relay.ts, consumer.ts, redis.ts. Dependencies: bullmq, ioredis;
dev: Testcontainers redis image.
Approved by: <name>, <date>.

## Decisions

## Progress log

## Next step

/write-tests T-005
