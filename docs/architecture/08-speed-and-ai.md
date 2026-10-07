# Chapter 8 · Speed and AI

The architecture is already fast by shape (no network between modules) and already AI-friendly (typed contracts, events and history). This chapter covers the habits that keep it fast, and how AI plugs in as just another capability, with people approving what it proposes.

## Part 1 · Speed

### Where slowness actually comes from

In business apps, slowness almost never comes from the programming language. It comes from:

1. **Database queries:** missing indexes, fetching thousands of rows, or running one query per row in a loop (the "N+1" problem).
2. **Slow work inside a user's request:** sending emails, generating PDFs, calling AI or outside systems while the user waits.
3. **Too much data sent to the browser,** and screens that redraw everything on every change.

### Ten habits that keep us fast

| #   | Habit                                                     | What it means                                                                                                         |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Anything slow goes to the background                      | Emails, PDFs, AI, outside systems run as BullMQ jobs; the user gets an instant reply and a notification when done     |
| 2   | Index what you filter by                                  | Every business table gets an index starting with `company_id`, plus indexes for common filters and sorts              |
| 3   | Always paginate                                           | Lists load 50 rows at a time, never "all"                                                                             |
| 4   | No queries in loops                                       | Load related rows in one query; the ORM's batch loading makes this easy                                               |
| 5   | Read copies instead of cross-module calls on every screen | Chapter 6, rule 3                                                                                                     |
| 6   | Cache what's read often and changes rarely                | Redis holds things like settings and price lists; events clear the cache when data changes                            |
| 7   | Pool database connections                                 | PgBouncer shares a small number of real connections among many requests                                               |
| 8   | Use NestJS with the Fastify adapter                       | A lighter web layer than the default, with no change to how we write modules                                          |
| 9   | Keep the browser light                                    | Each module's screens load only when opened; big tables draw only the visible rows; TanStack Query caches server data |
| 10  | Measure, don't guess                                      | Traces show exactly which query or call made a request slow (chapter 10)                                              |

Set a simple target for the team, for example: most API responses under 200 ms, every screen usable within a second. Traces tell us when we miss it.

### How it grows when a client gets bigger

1. Run more copies of the `api` container behind the proxy, and more `worker` containers for jobs.
2. Give PostgreSQL a bigger server, then a read replica for reports.
3. Only if one module truly needs it, move that module out into its own service. The walls make this possible.

## Part 2 · Designing for AI

### Rule 1 · AI is a capability, not a special case

The kernel defines AI capabilities like `ai.complete`, `ai.extract` and `ai.embed`. Adapters provide them for whichever AI vendor we choose, or a model we host ourselves. Switching vendor, or using a different one per client, is a configuration change, exactly like chapter 5.

### Rule 2 · AI always runs in the background

AI calls take seconds, can fail and are rate-limited by the vendor. So every AI task is a BullMQ job with retries and a rate limit. The user sees "drafting..." and is notified when the result is ready.

### Rule 3 · AI proposes, people approve

AI never changes real records directly. It creates a **suggestion**: a draft with the state "suggested", visible to the person who must review it. The person edits, approves or rejects. Approved suggestions go through the normal use case, with the normal validation and permissions.

A typical AI flow:

1. A user uploads a document; the owning module saves it and publishes `document.received`.
2. An AI listener queues an extraction job.
3. The job calls `ai.extract` with a schema of the fields wanted.
4. The result is checked against that schema (with Zod, chapter 9); anything invalid is flagged, not guessed.
5. A suggestion record is created and the user is notified.
6. The user reviews and approves; the normal flow continues as if they had typed it.

As trust grows, a client can switch specific, low-risk suggestions to auto-approve through a setting.

### Rule 4 · AI is an actor in the audit log

Every AI action is recorded with actor `ai:<task-name>`, the prompt version, the model used, and who approved the result. When someone asks "why does this say X?", we can answer.

### Rule 5 · Our contracts are ready-made AI tools

Because every capability has a typed, validated contract, the same contracts can be offered to an AI agent as **tools** ("look up stock level", "create a draft"), for example through the Model Context Protocol (MCP). The agent then acts with a user's permissions through the same doors as any module. This is the biggest reason the architecture suits AI: we won't need a separate AI integration for each module.

### Rule 6 · Keep the data AI needs

- **Events and audit history** show what happened and why; they are the raw material for learning patterns and suggesting actions.
- **Original documents** (emails, PDFs, drawings) are stored, not only the typed-in data.
- **Embeddings** (numeric fingerprints of text used to find "similar" items) can live in PostgreSQL with the `pgvector` extension, so "find similar past records" needs no separate database at first.

### Rule 7 · Guard the edges

- Log and track AI cost per client and per task.
- Remove or mask sensitive data that a task doesn't need before sending it out.
- Version every prompt like code, and keep a small set of test examples per task to check quality when a prompt or model changes.
- Check each AI vendor's data-retention terms before sending client data.

## Remember

- Slowness comes from queries and waiting on slow work; indexes, pagination and background jobs fix most of it.
- AI is a capability behind an adapter, always runs as a background job, and only proposes.
- Typed contracts plus stored history make our system AI-ready by design.
