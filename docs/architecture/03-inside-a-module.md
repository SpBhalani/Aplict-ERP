# Chapter 3 · Inside a module

Every module has the same inner shape: business rules in the centre, and "ports" around the edge that connect it to everything else. Learn this shape once and you can read any module in the codebase, ours or a client's.

## Ports and adapters, simply

Think of a laptop. Inside is the computer (the business logic). Around the edge are **ports**: USB, HDMI, charging. A port is a _shape_, a promise of how to connect. Anything that fits the shape (a mouse, a keyboard, a projector) is an **adapter**. The computer doesn't care which brand of mouse you plug in.

In a module:

- A **port** is a TypeScript interface that says what the module needs or offers, with no detail of how.
- An **adapter** is a class that implements that interface for one specific thing: the PostgreSQL database, an HTTP controller, an event listener, another module's contract, a client's ERP.
- The **business logic** only ever talks to ports. It never imports the database library, never calls another module directly, never knows which adapter is plugged in.

This is called **hexagonal architecture** or **ports and adapters**. The payoff: the same logic works whether a capability comes from our module, an adapter or a fallback, and it can be tested with a fake adapter in milliseconds.

## The four layers inside a module

| Layer       | What lives here                                                                                                               | Allowed to import                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Domain      | Entities and business rules: what a valid record is, what may change when                                                     | Nothing outside the domain (plain TypeScript)              |
| Application | Use cases: "approve a record", "create a draft"; each loads data through ports, applies domain rules, saves, publishes events | Domain and ports                                           |
| Ports       | Interfaces for what the module needs (repositories, capabilities) and offers (its contract)                                   | Shared contract types only                                 |
| Adapters    | Real implementations: database repository, HTTP controller, event listeners, calls to other capabilities                      | Anything needed, including NestJS and the database library |

The rule: arrows point inwards. Adapters know about the application; the application knows about the domain; the domain knows about nothing.

## A port in code

```typescript
// ports/stock-level.port.ts
// What this module NEEDS, described as a shape. No database, no HTTP.
export interface StockLevelPort {
  checkLevel(itemId: string, siteId: string): Promise<{ available: number; unit: string }>;
}

// application/reserve.use-case.ts
// The use case only knows the port. Whoever provides it is decided elsewhere.
export class ReserveUseCase {
  constructor(private readonly stock: StockLevelPort) {}

  async run(itemId: string, siteId: string, qty: number) {
    const level = await this.stock.checkLevel(itemId, siteId);
    if (level.available < qty) throw new NotEnoughStockError(itemId);
    // ...save the reservation through a repository port, then publish an event
  }
}
```

In NestJS, the provider behind `StockLevelPort` is chosen when the app starts, from the capability registry. Changing provider means changing configuration, not this code.

## The manifest in code

The manifest is a plain TypeScript object that the loader reads before anything runs.

```typescript
// manifest.ts
export const manifest = defineModule({
  name: 'example',
  version: '1.2.0',
  kernel: '^1.0.0', // kernel versions it works with
  provides: [{ capability: 'stock.checkLevel', version: 1 }],
  requires: [{ capability: 'pricing.getPrice', version: 1, optional: false, fallback: 'manual' }],
  publishes: [{ event: 'example.record-approved', version: 1 }],
  subscribes: [{ event: 'other.item-changed', version: 1 }],
  ui: {
    menu: [{ label: 'Example', path: '/example' }],
    widgets: [{ slot: 'record.sidebar', component: 'ExampleWidget' }],
  },
  permissions: ['example.record.approve'],
  settings: [{ key: 'example.approvalLimit', type: 'number', default: 0 }],
  records: ['example.record'], // can take custom fields and workflows
  extensionPoints: ['example.beforeApprove', 'example.priceRule'],
  jobs: [{ name: 'example.dailyReminder', cron: '0 9 * * *' }],
});
```

## Folder layout in the monorepo

A **monorepo** is one Git repository holding many packages that are built together. Every module is its own package.

```text
apps/
  api/                  NestJS app: boots the kernel, reads manifests, loads enabled modules
  web/                  React app shell
  worker/               same code as api, but runs background jobs only
packages/
  kernel/               the kernel services
  contracts/            capability and event definitions shared by everyone
  modules/
    example/
      manifest.ts
      src/
        domain/         entities and rules
        application/    use cases
        ports/          interfaces
        adapters/       http/, db/, events/, capabilities/
        public-api.ts   the ONLY file other packages may import
        example.module.ts
      ui/               React pages and widgets for the shell
      migrations/       this module's database changes
clients/
  client-a/             client package: custom code, config, extensions
```

**`public-api.ts` is the door.** It exports the module's contract types and nothing else. A lint rule fails the build if any package imports a path inside another module's `src/`.

## Remember

- Logic in the middle, ports at the edges, adapters plug into ports.
- Arrows point inwards: the domain knows nothing about NestJS or PostgreSQL.
- Every module is a package with a manifest and one door (`public-api.ts`).
