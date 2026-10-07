# Modular Platform Architecture — How Modules Plug In

Sep 30, 2026 · @Smit Bhalani

## The recommendation

Build a **modular monolith with a plug-in contract**: one application per client, made of independent modules that sit on a shared kernel, talk only through published contracts and events, and never touch each other's data.

Five ideas make it work:

1. **A kernel that is always there.** Users, roles, tenancy, settings, audit, files, notifications, workflow and the module loader. Every module depends on the kernel; the kernel depends on no module.
2. **Modules depend on capabilities, not on other modules.** A module says "I need _customer credit status_", never "I need the Credit module". Something must provide that capability: an internal module, an adapter to the client's own system, or a simple manual fallback. This is what lets you remove a module safely.
3. **Two ways to talk.** Ask a question or give an instruction through a module's public contract (a request), or announce that something happened (an event). No shared tables, no reaching into another module's code.
4. **Every module ships with a manifest.** A short declaration of what it provides, what it needs, which events it sends and listens to, its screens, permissions and settings. The loader reads it and wires the module in or refuses to start if something is missing.
5. **Client code is a plug-in too.** Each client's custom code lives in its own package that uses the same extension points. The core is never edited for one client.

**What not to do now:** don't start with microservices. With a small team and 4 to 5 clients, microservices multiply servers, deployments and failure points without giving you modularity you can't get more cheaply inside one application. Clean module boundaries let you split a module out later if one ever needs to scale alone.

## At a glance

Every client instance has the same five layers; only the set of modules and the client package change.

&#91;embedded content: platform layers · shell, modules, wiring, kernel, infrastructure\]

The highlighted wiring layer is the heart of the design. Because modules only ever meet there, any module, adapter or client package that follows the contract can be added or taken away.

## The kernel: what every deployment always has

The kernel is the small, mandatory base: 15 shared services in 4 groups, with no business rules inside. If a feature would only make sense for one kind of business, it does not belong in the kernel.

| Group                  | Kernel service             | What it does                                                                                        |
| ---------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Identity and structure | Identity and access        | Login, users, roles, permissions; each module registers its own permissions at install              |
| Identity and structure | Organisation               | Companies, branches, sites, tax registrations, currencies, calendars                                |
| Identity and structure | Settings and feature flags | Settings each module declares, switchable per company; flags to turn features on gradually          |
| Wiring                 | Module registry and loader | Reads each module's manifest, checks what it needs, runs its data migrations, turns it on or off    |
| Wiring                 | Capability registry        | Knows which provider serves each capability in this deployment (a module, an adapter or a fallback) |
| Wiring                 | Event bus                  | Delivers events between modules reliably, with retries and a holding area for failures              |
| Wiring                 | API gateway                | One front door for outside callers: public APIs, webhooks, API keys                                 |
| Business plumbing      | Workflow and approvals     | States, transitions and approval rules any module can attach to its documents                       |
| Business plumbing      | Custom fields and metadata | Add fields to any record without code                                                               |
| Business plumbing      | Documents and files        | Attachments, versions, numbering series, PDF generation from templates                              |
| Business plumbing      | Notifications              | Email, WhatsApp, in-app messages from templates                                                     |
| Business plumbing      | Jobs and scheduler         | Background work, reminders, timed tasks                                                             |
| Operations             | Audit log                  | Who changed what and when, for every record in every module                                         |
| Operations             | UI shell                   | The app frame: navigation, layout and slots that modules fill with their pages and widgets          |
| Operations             | Observability              | Logs, metrics and traces across all modules                                                         |

The kernel changes rarely and carefully, because every module and every client depends on it. Treat a kernel change like a public API change.

## Anatomy of a module

Every module, whether ours, an adapter or a client's, has the same shape: business logic and data in the middle, and six declared ports around it. This is the ports-and-adapters (hexagonal) pattern applied to the whole platform.

&#91;embedded content: module anatomy · logic, data and six ports\]

The logic never calls a database, another module or an outside system directly. It only talks through its ports, which is why the same logic works whether a capability is served by another module, an adapter or a fallback.

### The manifest: a module's identity card

The loader reads the manifest at start-up. If something a module needs is missing and has no fallback, the loader refuses to start that module and says why.

| Section          | What it declares                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Identity         | Name, version, the kernel version it needs                                                   |
| Provides         | Capabilities it serves to others, with contract versions                                     |
| Requires         | Capabilities it needs; for each, whether it is required or optional and what the fallback is |
| Publishes        | Events it sends, with versions                                                               |
| Subscribes       | Events it listens to                                                                         |
| UI               | Menu items, pages, and widgets for named slots                                               |
| Permissions      | Actions it adds to the role system                                                           |
| Settings         | Settings it adds, with defaults                                                              |
| Records          | Its record types, which can take custom fields and workflows                                 |
| Extension points | Named hooks and replaceable rules that client packages may use                               |
| Data             | Its schema name and migrations                                                               |
| Jobs             | Scheduled or background tasks it runs                                                        |

## How modules talk

Modules use exactly four channels, and each has one job. Pick the channel by asking: do I need an answer now, am I announcing a fact, or does this flow wait for days?

| Channel | Use it when                                                             | How it works                                                                                                      | Rule                                                                           |
| ------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Request | You need an answer or an action right now ("is this customer on hold?") | Call a capability through the registry; a direct in-app call today, a network call if the provider ever moves out | Only through the published contract, never into another module's code          |
| Event   | You announce something that already happened ("invoice issued")         | The owner publishes; any module can subscribe; the sender doesn't know or care who listens                        | Past-tense names, versioned content, listeners safe to run twice               |
| Process | A flow crosses modules and waits (hours or days)                        | A process manager keeps the flow's state, sends requests and waits for events                                     | Each step can be retried or undone; the process owns the flow, not the modules |
| UI slot | A screen shows data from several modules                                | Modules place widgets into named slots on shared pages in the UI shell                                            | A widget reads through its own module's contract only                          |

### How an event travels safely

1. A module saves its change and writes the event into its own outbox table, in the same database transaction.
2. A relay picks up new outbox rows and hands them to the event bus.
3. The bus delivers the event to every subscriber, retrying on failure.
4. Each subscriber records the event ID so a repeat delivery does nothing twice.
5. Events that keep failing move to a holding area for someone to inspect.

This is the transactional outbox pattern. It guarantees [a message goes out if and only if the database change commits](https://microservices.io/patterns/data/transactional-outbox), and because a relay can send the same message twice, [listeners must be idempotent](https://microservices.io/patterns/data/transactional-outbox) (safe to run twice).

### Contracts are versioned like public APIs

Every request and event has a written contract and a version number. Adding a field is safe; removing or renaming one needs a new version, with the old one kept alive until every listener has moved.

## Removing or replacing a module

A module can be removed without touching the others because nobody depends on the module itself, only on the capabilities it provides. When it goes, something else must provide those capabilities.

&#91;embedded content: capability swap · one contract, three kinds of provider\]

### What happens when a module is removed

1. The loader lists every capability the module provided.
2. For each one, configuration picks a replacement: an adapter to the client's own system, or a fallback.
3. Events the module used to publish now come from the adapter, which listens to the client's system and translates, or they simply stop, and listeners were built to cope with that.
4. The module's screens and widgets disappear from the UI shell's slots; pages still render with the slots that remain.
5. The module's data schema is archived, not deleted.

### Three rules that make this safe

- **Capabilities are named for the business question, not the module.** "Check stock level", not "Inventory module API". Then any provider can answer it.
- **Every required capability ships with a fallback.** The fallback can be basic (a manual task, a default answer), but it must exist so the system never breaks.
- **Listeners never assume an event will come.** A module that reacts to an event must still work, perhaps with less automation, when nobody publishes it.

The same mechanism also works the other way: a module outside today's scope fits in as long as it declares a manifest and speaks through capabilities and events.

## Data rules

Each module owns its data completely; sharing happens through contracts and events, never through shared tables. This is the rule that makes a module removable.

1. **One schema per module.** A module's tables live in its own database schema. No other module reads or writes them, and there are no database foreign keys across schemas.
2. **Refer by ID, look up by contract.** A module that needs another's record stores only its ID and asks the owner through the contract when it needs details.
3. **Keep a local copy when you need data often.** A module can hold a small read-only copy of the fields it needs, kept current by the owner's events. The owner stays the only one who changes the original.
4. **One owner for shared reference data.** Customers, products and similar master records have exactly one owning module (or an outside system); everyone else holds copies.
5. **Reports read from a separate store.** A reporting database is fed by events or replication, so reports can combine data from many modules without any module joining another's tables.
6. **Shared value types live in the kernel.** Money with currency, quantity with unit, dates with time zone, addresses: defined once so every module means the same thing.
7. **Global IDs.** Use globally unique IDs so records can move between databases, instances or a future split-out service without renumbering.
8. **Migrations belong to the module.** Each module versions its own schema changes. Removing a module archives its schema; nothing else breaks.
9. **One database per client.** Because each client runs its own custom code, give each client its own database. This also keeps one client's data physically separate from another's.

## Client customisation and deployment

Each client gets its own instance, assembled by the same automated pipeline from four inputs; only two of them are unique to the client.

&#91;embedded content: client instance assembly · 4 inputs, 1 pipeline\]

The core release is shared by all clients and never edited for one. The client package and configuration are the only things that differ, so a core upgrade reaches every client through the same pipeline, and contract tests catch any custom code it would break.

### The customisation ladder

Climb only as high as the need requires; each step up costs more to maintain.

1. **Configuration:** settings, custom fields, workflow states, templates, provider choices. No code.
2. **Rules and scripts:** small, sandboxed formulas or scripts attached to named extension points, such as a pricing formula or a validation rule.
3. **Client code:** a full client package with its own logic, screens, records and even whole modules, built to the same manifest and contract rules as ours.

### Kinds of extension point every module should offer

| Extension point          | What client code can do                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Before and after hooks   | Run extra steps around an action, like before a record is saved or after it is approved |
| Replaceable rules        | Swap in their own calculation or check in place of ours                                 |
| Event listeners          | React to any published event                                                            |
| Extra records and fields | Add their own data linked to ours                                                       |
| UI slots                 | Add screens, tabs, buttons and widgets                                                  |
| Adapters                 | Provide a capability from their own systems                                             |

Client code may use only these points. If a client needs to change something that has no extension point, we add the extension point to the core, which benefits every future client, rather than editing the core for that one client.

## Proven patterns and technology options

Everything above is built from well-known, community-standard patterns; nothing here is invented. The team can look each one up by name.

| Pattern (search this name)                                         | What it means, simply                                                                                     | Where we use it                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Modular monolith                                                   | One application, strict internal boundaries between modules                                               | The whole platform                               |
| Bounded contexts (from Domain-Driven Design)                       | Each module owns one area of the business, with its own words and data                                    | How we draw module lines                         |
| Hexagonal architecture, or ports and adapters                      | Business logic in the middle; everything outside (database, other systems) plugs in through defined ports | Inside each module, and for capability providers |
| Plugin architecture with manifests                                 | Modules declare themselves; a loader wires them in                                                        | Module registry and loader                       |
| Event-driven architecture                                          | Modules announce facts; others react                                                                      | The event bus                                    |
| Transactional outbox                                               | Save data and event together so neither is lost                                                           | Every event a module sends                       |
| Saga or process manager                                            | A long flow across modules, with retries and undo steps                                                   | The process channel                              |
| Anti-corruption layer                                              | A translator so an outside system's model never leaks into ours                                           | Every adapter to a client's own system           |
| Contract-first APIs (OpenAPI for requests, AsyncAPI for events)    | Write the contract before the code                                                                        | Every request and event                          |
| Consumer-driven contract tests                                     | Each consumer's expectations run as tests against the provider                                            | Core releases and client packages                |
| Feature flags                                                      | Switch features on per company without redeploying                                                        | Settings and rollout                             |
| Read models (a light form of CQRS)                                 | Separate stores shaped for reading and reporting                                                          | The reporting store and local copies             |
| Standard identity (OpenID Connect, OAuth 2) with role-based access | Industry-standard login and permission model                                                              | Identity and access                              |
| OpenTelemetry                                                      | A shared standard for logs, metrics and traces                                                            | Observability                                    |
| Containers and infrastructure as code                              | Every client instance built the same way from scripts                                                     | Per-client deployment                            |

### Why a modular monolith first, not microservices

|                              | Modular monolith                            | Microservices                                               |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Things to deploy per client  | 1 application + database                    | One per module, plus a message broker and service discovery |
| Team needed                  | Small team can run it                       | Needs dedicated platform and operations skills              |
| Removing a module            | Turn it off in the manifest                 | Turn it off, plus network and deployment changes            |
| Finding a bug across modules | One log, one trace                          | Spread across many services                                 |
| Scaling one busy part        | Scale the whole app (enough at our size)    | Scale that one service                                      |
| Later path                   | Split a module out when a real need appears | Already split                                               |

This is the mainstream advice. Martin Fowler observed that [successful microservice systems usually started as a monolith that was later broken up](https://sdtimes.com/martin-fowler-monolithic-apps-first-microservices-later/), because good service boundaries are only clear after the system has run for a while. Shopify, one of the largest Rails codebases, [chose a modular monolith over microservices](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) for the same reason.

### Technology options (choose once, then standardise)

| Layer                  | Common choices                                                                                                     | Note                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Language and framework | Java with Spring (Spring Modulith enforces module boundaries), C# .NET, TypeScript with NestJS, Python with Django | Pick what your team knows best; the pattern matters more than the language        |
| Database               | PostgreSQL                                                                                                         | Schemas per module, strong transactions, JSON fields for custom fields            |
| Event bus              | In-app bus plus outbox to start; RabbitMQ, NATS or Kafka later                                                     | Start in-process; the outbox lets you switch to a broker without changing modules |
| Long-running processes | Built-in state machine to start; Temporal or Camunda later                                                         | Only when flows get complex                                                       |
| Identity               | Keycloak or a managed identity service                                                                             | Standard login, roles, single sign-on                                             |
| Front end              | One web app shell with plugin slots; micro-frontends only if teams grow                                            | Modules ship their own screens into the shell                                     |
| Deployment             | Docker containers, Terraform or similar, one instance per client                                                   | Same scripts for every client                                                     |

## Golden rules, risks and how to start

### Ten golden rules

1. The kernel never depends on a module.
2. A module never imports another module's code; it uses capabilities, events and UI slots only.
3. A module never reads or writes another module's tables.
4. Every module declares everything in its manifest; the loader refuses anything undeclared.
5. Every capability a module needs has a fallback, even if the fallback is "a person does it by hand".
6. Every event is written through the outbox, and every listener is safe to run twice.
7. Every contract has a version; breaking changes get a new version.
8. Client code lives only in the client package and plugs in only through extension points.
9. A custom feature built for three clients moves into the core.
10. Boundaries are checked automatically in the build, so a broken rule fails the build instead of waiting for a code review.

### Risks to watch

| Risk                             | What it looks like                                             | Guard                                                              |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| Boundaries erode                 | A "quick fix" joins another module's table                     | Automated boundary checks in every build                           |
| Wrong module lines               | Two modules keep calling each other for every step             | Merge them; review lines after the first 2 clients                 |
| Over-engineering early           | Brokers, clusters and services before the first client is live | Start in-process; add infrastructure only when a real need appears |
| Client packages break on upgrade | A core release breaks client 3's custom code                   | Contract tests for every client package on every release           |
| Too many fallbacks               | Everything "works" but half the flows are manual               | Track which capabilities run on fallback per client                |

### How to start

1. Build the kernel first, with one tiny test module that uses every channel: a request, an event, a process and a UI slot.
2. Write the manifest format and the capability registry before any real module.
3. Build the first two business modules and prove one can be removed and replaced by a fallback without a single code change in the other.
4. Set up the per-client build pipeline and deploy one test client instance end to end.
5. Only then start the remaining modules, each against the same checklist.

### Sources

- [Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox), microservices.io
- [Martin Fowler: Monolithic apps first, microservices later](https://sdtimes.com/martin-fowler-monolithic-apps-first-microservices-later/), SD Times
- [Deconstructing the Monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity), Shopify Engineering
