# Chapter 4 · How modules talk

Modules talk in four ways: **requests** (ask and wait for an answer), **events** (announce news), **processes** (long flows) and **UI slots** (sharing a screen). To start, we recommend PostgreSQL outbox tables plus **BullMQ on Redis** as the event bus. Most of this chapter explains what that means.

## 1 · Requests: "I need an answer now"

A request is like phoning someone: you ask, you wait, you get an answer. Use it when your code cannot continue without the answer ("is this item in stock?").

In our app, a module asks the capability registry for whoever provides a capability, then calls a method on it. Inside one program this is an ordinary function call, so it is very fast. Two rules:

- Call only through the capability contract, never another module's internal classes.
- Never chain long rows of requests across many modules; if a flow touches many modules, it is probably a process (section 3).

## 2 · Events: "something happened"

An event is like a notice pinned on a board: "Record 42 was approved at 10:15." The module that pins it does not know or care who reads it. Any module interested subscribes and reacts in its own way.

Why this matters for us: if the module that reacts is removed, the one that announced doesn't notice or break. That is exactly the independence we want.

### The words you'll hear

| Word                             | Meaning                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Message                          | One piece of data sent from one place to another; an event is a kind of message        |
| Publisher (producer)             | Whoever sends the event                                                                |
| Subscriber (consumer, listener)  | Whoever receives and reacts to it                                                      |
| Queue                            | A waiting line of messages; each is handed out, processed, then removed                |
| Topic                            | A named channel, like "record-approved"; many subscribers can listen to one topic      |
| Acknowledge                      | The subscriber says "done"; until then the message stays safe in the queue             |
| Retry with backoff               | Try again after a failure, waiting a little longer each time (1s, 5s, 30s...)          |
| Dead-letter queue (holding area) | Where a message goes after too many failed tries, for a person to inspect              |
| Idempotent                       | Running it twice has the same result as running it once                                |
| Message broker                   | The software that stores and delivers messages (Redis with BullMQ, RabbitMQ, Kafka...) |

### Why not just call the listeners directly?

NestJS has a simple in-memory event emitter: publish, and listeners run immediately in the same program. It's fine for tiny things, but for business events it has three problems:

1. If the server restarts at the wrong moment, events in memory are **lost** forever.
2. A slow listener (sending an email, calling AI) **slows down** the user's request.
3. If a listener fails, there is **no retry**.

A real event bus solves all three: events are stored, handled in the background, and retried.

### The trap: saving and sending are two separate steps

Say a module saves a record, then sends an event to Redis. If the server crashes between the two, the record is saved but nobody ever hears about it. If you send first and then the save fails, everyone hears about something that never happened. This is called the **dual-write problem**.

### The fix: the outbox

&#91;embedded content: an event's journey · outbox, relay, queue, listeners\]

1. The module saves its change **and** writes the event into an `outbox` table, in the **same database transaction**. PostgreSQL guarantees both are saved, or neither.
2. A small background loop, the **relay**, reads new outbox rows every moment and puts them on the job queue, then marks them sent.
3. The queue delivers each event to every subscriber, retrying failures with backoff.
4. Because a relay might occasionally send the same event twice, every listener first checks a `processed_events` table: seen this ID before? Skip it. That makes listeners **idempotent**.
5. After too many failures, the event moves to the holding area, and we get an alert.

This is the standard [transactional outbox pattern](https://microservices.io/patterns/data/transactional-outbox).

### What an event looks like

```typescript
{
  id: '01J9Z3...',                    // unique ID, used to skip duplicates
  type: 'example.record-approved',    // who.what-happened, in past tense
  version: 1,                         // bump when the shape changes in a breaking way
  occurredAt: '2026-09-30T10:15:00Z',
  companyId: 'c_01...',               // which company in this client
  actor: 'u_01...',                   // who caused it (a user, a job or AI)
  correlationId: 'req_01...',         // ties together everything from one user action
  data: { recordId: 'r_01...', approvedBy: 'u_01...' }
}
```

### Which event bus to start with

| Option                   | What it is                                                      | Extra thing to run | Good for                                                 | For us                            |
| ------------------------ | --------------------------------------------------------------- | ------------------ | -------------------------------------------------------- | --------------------------------- |
| NestJS in-memory emitter | Events inside one running program                               | Nothing            | Tiny, non-critical reactions                             | Only for trivial in-process hooks |
| pg-boss                  | A job queue stored in PostgreSQL                                | Nothing            | Teams that want zero extra infrastructure                | Good backup choice                |
| **BullMQ on Redis**      | A popular Node.js job queue; NestJS has an official integration | Redis              | Background jobs, retries, delays, schedules, rate limits | **Start here**                    |
| RabbitMQ                 | A classic message broker                                        | RabbitMQ server    | Many services, complex routing                           | Later, if we split services       |
| NATS JetStream           | A lightweight, fast broker with stored streams                  | NATS server        | Many services, high speed                                | Later, if we split services       |
| Kafka                    | A heavy-duty event log                                          | Kafka cluster      | Huge event volumes, analytics                            | Not for us                        |

**Why BullMQ:** it gives us retries with backoff, delayed jobs ("remind in 3 days"), repeat schedules ("every morning at 9"), rate limits (important for AI APIs that allow only so many calls a minute), priorities and a web dashboard to see failed jobs. Redis is also useful as a cache. One tool covers events, background jobs and schedules.

**The safety net:** modules never use BullMQ directly. They call our own `EventBus` interface from the kernel (a port, chapter 3). If we ever outgrow BullMQ, only the kernel's adapter changes.

## 3 · Processes: flows that wait

Some flows cross several modules and take hours or days: "when approved, reserve; when reserved, notify; if reserving fails, undo the approval". This is a **process** (also called a **saga**).

We implement it as a small record in the database that remembers which step the flow is on, plus a state machine that reacts to events and sends the next request. If a step fails, the process runs an undo step (a **compensation**). Start with our own simple state machine; tools like Temporal exist for when flows get complex.

## 4 · UI slots: sharing a screen

A page can show widgets from several modules, like a record page with a side panel from another module. The shell has named slots; each module's manifest says which slots it fills. Chapter 9 shows how this works in React.

## Remember

- Need an answer now: a request. Announcing news: an event. Waiting for days: a process.
- Save the change and the event together (outbox), deliver with retries, and make every listener safe to run twice.
- Start with BullMQ on Redis, always behind our own `EventBus` interface.
