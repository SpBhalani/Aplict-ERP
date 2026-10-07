# Chapter 7 · Custom code per client

Custom code per client is our advantage, and it stays maintainable only if it lives in a **client package** that plugs into named **extension points**. The core is never copied or edited for one client.

## The one mistake that kills this business: forking

**Forking** means copying the code for client 3 and changing it directly, often as a long-lived Git branch. It feels fast. A year later you have five slightly different products, a bug fix must be made five times, and no client can be upgraded. Every rule in this chapter exists to avoid that.

## What a client package is

A package in the monorepo, under `clients/<client-name>/`, containing everything unique to that client:

- their configuration (settings, custom fields, workflows, templates, capability providers)
- their hooks and rules
- their adapters to their own systems
- any extra modules built only for them
- their tests

It declares which core version it works with, and it may use only the extension points that core modules publish.

```typescript
// clients/client-a/src/index.ts
export default defineClientPackage({
  name: 'client-a',
  core: '^1.4.0', // works with core 1.4 and later 1.x
  hooks: {
    'example.beforeApprove': async (ctx, record) => {
      if (!record.customFields.shadeNumber) ctx.reject('Shade number is required');
    },
  },
  rules: {
    'example.priceRule': (input) => input.basePrice * 0.97, // their own formula
  },
  listeners: {
    'example.record-approved': async (event, ctx) => ctx.jobs.add('client-a.push-to-erp', event),
  },
  adapters: [ErpStockLevel], // provides a capability from their ERP
  modules: [ShadeCardModule], // a whole extra module, same manifest rules
});
```

## Climb the ladder only as far as needed

| Step                    | What it is                                                           | Who can do it                                  | Cost to maintain                       |
| ----------------------- | -------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| 1 · Configuration       | Settings, custom fields, workflow states, templates, provider choice | Our implementation team, or the client's admin | Lowest                                 |
| 2 · Rules and scripts   | Small functions attached to replaceable rules                        | A developer, in minutes                        | Low                                    |
| 3 · Hooks and listeners | Code that runs before or after actions, or on events                 | A developer                                    | Medium                                 |
| 4 · Adapters            | Connectors to the client's own systems                               | A developer                                    | Medium; breaks if their system changes |
| 5 · Client modules      | Whole new features just for them                                     | A developer or team                            | Highest                                |

## Extension points: the only doors for client code

Every core module publishes a list of extension points in its manifest. Designing them well is one of the most important jobs in each module's design:

- **Before hooks** can check and reject ("don't approve without X").
- **After hooks** can do extra work once an action succeeds.
- **Replaceable rules** swap a calculation or a decision.
- **Event listeners** react to anything published.
- **Extra records and fields** add the client's own data, linked by ID.
- **UI slots** add tabs, panels, buttons and whole pages.

If a client needs something with no extension point, we **add the extension point to the core**, then use it from the client package. The next client gets that door for free.

## Versions: how the core and clients stay in step

The core uses **semantic versioning**: `MAJOR.MINOR.PATCH`, for example `1.4.2`.

| Part              | Changes when                                          | Safe for client packages?           |
| ----------------- | ----------------------------------------------------- | ----------------------------------- |
| PATCH (1.4.**2**) | A bug fix                                             | Always safe                         |
| MINOR (1.**4**.0) | New features or new extension points, nothing removed | Safe                                |
| MAJOR (**2**.0.0) | Something removed or changed in a breaking way        | Needs checking and possibly changes |

Each client instance runs a pinned core version. Upgrading a client is a deliberate step, not an accident.

## Contract tests: the net that catches breakage

A **contract test** checks that a promise still holds: "the hook `example.beforeApprove` is still called with a record that has these fields". Core modules test their own promises. Each client package has tests for what it relies on. When we build a new core version, the pipeline runs every client package's tests against it. If client 3's tests fail, we know before client 3 does.

## Upgrading a client, step by step

1. Release a new core version with its change notes.
2. The pipeline runs every client package's tests against it automatically.
3. For clients whose tests pass, schedule the upgrade and deploy.
4. For clients whose tests fail, fix their package (or the core, if we broke a promise), then deploy.
5. Never let a client fall more than one MAJOR version behind; the gap only gets more expensive.

## The "three clients" rule

When the same custom piece has been built for three clients, it moves into the core as a standard feature, controlled by a setting. This is how our client work steadily becomes product.

## Remember

- Never fork. Client code lives in `clients/<name>/` and uses extension points only.
- Missing door? Add the extension point to the core, not a hack to the core.
- Pinned core versions, contract tests on every release, and three clients means it moves into the core.
