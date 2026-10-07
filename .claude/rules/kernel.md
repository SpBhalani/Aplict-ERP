---
paths:
  - 'packages/kernel/**'
---

# Working in the kernel

- You are here only in a kernel task the human started. If tasks/ACTIVE
  scope doesn't include packages/kernel/, stop.
- The kernel holds plumbing, never business rules. Words like quote, order,
  invoice, price, discount or stock must not appear in kernel code.
- The kernel never imports a module or a client package. To react to a
  module, listen to an event.
- Every kernel service is used through an interface (port) exported from
  src/public-api.ts; modules receive it by NestJS dependency injection.
- A change to a public kernel interface is a breaking change for every
  module and client: it needs an ADR, a version note and pnpm verify:full.
- Only packages/kernel/src/adapters/ may import infrastructure libraries
  (bullmq, drizzle-orm, pg, ioredis, S3 clients).
- Shared value types (Money, Quantity, Id) live in the kernel and are never
  redefined in modules.
- Read docs/architecture/02-kernel.md before adding a service.
