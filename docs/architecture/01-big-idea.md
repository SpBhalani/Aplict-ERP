# Chapter 1 · The big idea

We build a **modular monolith**: one application that runs as one program, but is split inside into rooms (modules) with walls between them. It is modern, it is feasible with TypeScript, NestJS and PostgreSQL, and it is the fastest of the three shapes.

## Three ways to shape an application

&#91;embedded content: three ways to shape an app · monolith, modular monolith, microservices\]

### The house analogy

Think of the application as a house.

- **Monolith:** one huge open room. The kitchen things, the bed and the office desk are all mixed together. It is quick to move in, but after a year nobody can find anything, and moving the bed knocks over the stove. In code: any file can call any other file and read any table, so a small change breaks something far away.
- **Microservices:** a separate small house for each function, connected by roads. Each house can be rebuilt alone, but now you need roads, a postal service, a lock on every door and someone to watch every house. In code: every module is its own server that talks over the network, so you need more servers, more monitoring and more skills to keep it running.
- **Modular monolith:** one house with proper rooms, doors and hallways. Each room has its own furniture (its own data) and you enter only through the door (its contract). You can lock a room and the house still works. In code: one program, one deployment, but strict rules about who may call what.

## Why the middle path is right for us

1. **We need to remove and add modules per client.** Walls and doors give us that. We don't need separate servers to get it.
2. **We are a small team starting with 4 to 5 clients.** One program per client is far easier to build, test, deploy and debug than ten services per client.
3. **Each client gets its own copy.** With microservices, 5 clients times 10 services means 50 things to run. With a modular monolith it is 5.
4. **We can still split later.** Because the walls are clean, a module that ever needs its own server can be moved out without rewriting it.

## Is this modern, and is it feasible with our stack?

**Yes on both.** The modular monolith is a mainstream choice in the 2020s. Shopify, one of the biggest Rails codebases in the world, [chose it over microservices](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity). The Java world has a whole framework for it (Spring Modulith), and [Martin Fowler's long-standing advice](https://sdtimes.com/martin-fowler-monolithic-apps-first-microservices-later/) is to start this way rather than with microservices.

Our stack fits it naturally:

| What the architecture needs          | What gives it to us                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Modules with clear boundaries        | NestJS is built around modules; each of ours becomes a Nest module in its own package |
| Only the contract visible to others  | Each package exports only its public contract; lint rules block any other import      |
| Wiring things together at start-up   | NestJS dependency injection, plus our own module loader reading manifests             |
| Separate data per module             | PostgreSQL schemas: one per module, inside one database                               |
| Reliable events and background work  | An outbox table in PostgreSQL plus a job queue (chapter 4)                            |
| One UI made of many modules' screens | A React app shell with slots that each module fills (chapter 9)                       |

NestJS does not stop one module from importing another's internals on its own. We add that protection with automatic boundary checks in the build (chapter 9).

## Will it be fast?

Yes, and this is a hidden advantage over microservices. When one module asks another a question inside the same program, it is an ordinary function call: it takes microseconds. The same question between two microservices goes over the network, which takes milliseconds, roughly a thousand times longer, and can fail. Chapter 8 covers the rest of speed.

## Remember

- One program per client, with walls inside.
- A module is a room: its own furniture (data), one door (contract).
- Clean walls today mean we can move a room out tomorrow, if we ever need to.
