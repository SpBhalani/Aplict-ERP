# Chapter 9 · The tech stack

Your choices, TypeScript, NestJS, PostgreSQL and React, are a strong, mainstream fit for this architecture. Below is the full stack with one pick per job, what each tool is in plain words, and why it's the pick. Where there's a close second, it's named.

## Backend

| Job                      | Pick                                                                            | What it is                                                                             | Why this one                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Language                 | TypeScript (strict mode), on Node.js LTS                                        | JavaScript with types; LTS is the long-supported Node version                          | One language front and back; types catch mistakes before running                              |
| Framework                | NestJS with the Fastify adapter                                                 | A structured Node framework built on modules and dependency injection                  | Its module system matches our architecture; Fastify is a lighter, faster web layer underneath |
| Database access          | Drizzle ORM (close second: Prisma)                                              | A typed way to write SQL queries and migrations from TypeScript                        | Makes schema-per-module simple, stays close to real SQL, and is quick                         |
| Validation and contracts | Zod                                                                             | Describes the shape of data once, then checks it at runtime and gives TypeScript types | One definition for API inputs, events, capability contracts and AI outputs                    |
| API docs                 | OpenAPI, generated from the code                                                | A standard description of every API endpoint                                           | Swagger UI for humans; a typed client generated for the frontend                              |
| Event bus and jobs       | BullMQ on Redis (or Valkey, a compatible open-source fork)                      | A job queue library plus a fast in-memory data store                                   | Chapter 4: retries, delays, schedules, rate limits, dashboard                                 |
| Real-time updates        | WebSockets through a NestJS gateway                                             | A connection that stays open so the server can push updates                            | "Your AI draft is ready" appears without refreshing                                           |
| Login                    | Keycloak when clients need single sign-on; NestJS auth (Passport, JWT) to start | Standard login server, or login built into our app                                     | Start simple; standards-based so we can switch later                                          |
| Files                    | An S3-compatible store on our server (MinIO or SeaweedFS)                       | Storage that speaks the same language as Amazon S3                                     | Drawings and PDFs out of the database; can move to any S3 service later                       |
| PDFs                     | Gotenberg                                                                       | A small Docker service that turns HTML into PDF                                        | Templates are plain HTML and CSS, easy to customise per client                                |
| Search                   | PostgreSQL full-text search; Meilisearch later                                  | Built-in text search; a dedicated search engine                                        | No extra service until we need it                                                             |
| AI similarity            | pgvector                                                                        | A PostgreSQL extension for embeddings                                                  | Chapter 8; no separate vector database                                                        |

## Frontend

| Job               | Pick                                            | What it is                                                                       | Why this one                                                                                                    |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| App type          | React single-page app built with Vite           | The browser loads the app once, then talks to our API; Vite is a fast build tool | Our app is behind a login, so we don't need server rendering                                                    |
| Routing           | TanStack Router (or React Router)               | Maps URLs to screens                                                             | Type-safe routes; each module adds its own routes                                                               |
| Server data       | TanStack Query                                  | Fetches, caches and refreshes API data                                           | Fast screens, fewer repeat requests                                                                             |
| Forms             | React Hook Form + Zod                           | Form state and validation                                                        | Reuses the same Zod shapes as the backend                                                                       |
| Tables            | TanStack Table with row virtualisation          | Headless table logic; draws only visible rows                                    | Business apps live in big tables                                                                                |
| Component library | Mantine (close second: shadcn/ui with Tailwind) | Ready-made buttons, inputs, date pickers, modals, notifications                  | Mantine is complete for data-heavy apps and themable per client; shadcn/ui gives full control but more assembly |
| Charts            | Recharts or Apache ECharts                      | Chart components                                                                 | Dashboards and reports                                                                                          |

### React or Next.js?

Next.js adds **server rendering**: building pages on the server so they appear fast and can be found by Google. That matters for public websites. Our product is a logged-in business app where search engines never look and the backend is already NestJS. A plain React app with Vite is simpler, faster to build, and easy to serve as static files. Use Next.js for our public marketing website if we want one.

### How UI slots work in React

Each module ships its screens in its `ui/` folder and registers them with the shell:

```tsx
// packages/modules/example/ui/register.ts
export function register(shell: ShellRegistry) {
  shell.addRoute({ path: '/example', component: lazy(() => import('./ExamplePage')) });
  shell.addMenuItem({ label: 'Example', path: '/example', permission: 'example.view' });
  shell.addWidget({ slot: 'record.sidebar', component: lazy(() => import('./ExampleWidget')) });
}

// Anywhere in the shell or another module's page:
<Slot name="record.sidebar" context={{ recordId }} />; // renders every widget registered for this slot
```

At build time, the client's module list decides which `register` functions are included, so a client's app contains only their modules. `lazy()` means a module's code downloads only when its screen is first opened.

## Tooling

| Job              | Pick                                     | What it is                                                            | Why this one                                                                           |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Monorepo         | pnpm workspaces + Nx                     | pnpm installs packages efficiently; Nx builds and tests many packages | Nx has a built-in rule that enforces module boundaries, and rebuilds only what changed |
| Boundary checks  | Nx `enforce-module-boundaries` lint rule | Fails the build if a package imports what it shouldn't                | Turns golden rule 2 into an automatic check                                            |
| Unit tests       | Vitest                                   | Fast test runner                                                      | Quick feedback on domain logic                                                         |
| Database tests   | Testcontainers                           | Starts a real PostgreSQL in Docker for each test run                  | Tests hit a real database, not a fake one                                              |
| End-to-end tests | Playwright                               | Drives a real browser through the app                                 | Proves whole flows work per client                                                     |
| Code style       | ESLint + Prettier (or Biome)             | Checks and formats code automatically                                 | Every file looks the same                                                              |

## How the three apps are built from one codebase

1. **api:** the NestJS app that answers the browser and outside callers.
2. **worker:** the same codebase started in "jobs only" mode; it runs the outbox relay, event listeners, schedules and AI tasks.
3. **web:** the React shell plus the enabled modules' screens, built into static files.

Splitting `api` and `worker` means heavy background work never slows down users' clicks, and each can be scaled on its own.

## Remember

- NestJS (Fastify) + Drizzle + Zod + BullMQ + PostgreSQL on the back; React + Vite + TanStack + Mantine on the front.
- One codebase, three runnable apps: api, worker, web.
- Nx enforces the walls automatically; Zod shapes are shared by backend, frontend and AI.
