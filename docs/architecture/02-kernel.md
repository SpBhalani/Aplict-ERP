# Chapter 2 · The kernel

The kernel is the foundation of the house: plumbing, wiring and the front door. Every client always gets it, every module stands on it, and it holds **no business rules** of its own.

## The one test for "does it belong in the kernel?"

Ask: _would every kind of business need this, in exactly the same way?_ Logging in, yes. Numbering documents, yes. Calculating a discount, no, that is business logic and belongs in a module. If the kernel ever knows what an "invoice" or a "quote" is, something has leaked in.

## Group 1 · Identity and structure: who you are and where you belong

| Service                    | In plain words                              | Everyday example                                                                         | How we build it                                                                                             |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Identity and access        | Who is logged in, and what may they do      | Priya logs in; she may approve documents but not delete them                             | Keycloak (or a NestJS auth module) for login; our own permission table; a NestJS guard checks every request |
| Organisation               | The shape of the client's business          | One group, two companies, three factories, two tax registrations                         | Kernel tables for company, branch, site; every record carries a company ID                                  |
| Settings and feature flags | Switches and values each company can change | "Require manager approval above this amount"; "turn on the new screen for branch 2 only" | A settings table; modules declare their settings with defaults in the manifest                              |

**Roles and permissions, simply:** a _permission_ is one action ("approve a record of type X"). A _role_ is a named bag of permissions ("Accounts manager"). A _user_ gets one or more roles. Each module announces its permissions when it is installed, so the role screen automatically shows new actions when a module is switched on, and hides them when it is removed.

## Group 2 · Wiring: how the pieces find each other

| Service                    | In plain words                                                 | Everyday example                                                                        | How we build it                                                                      |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Module registry and loader | The receptionist who checks every module's ID card at start-up | A module says it needs a capability nobody provides; the loader stops it and logs why   | Reads manifest files, then registers NestJS dynamic modules only for enabled modules |
| Capability registry        | The phone book: "who answers this question here?"              | "Check stock level" is answered by our module for one client and an adapter for another | A map from capability name to the provider class, filled from configuration          |
| Event bus                  | The notice board where modules pin news for anyone interested  | "A record was approved" is pinned; three modules read it and act                        | Outbox table + job queue (chapter 4)                                                 |
| API gateway                | The single front door for outsiders                            | The client's mobile app or a partner system calls our API                               | NestJS controllers behind a reverse proxy, with API keys and rate limits             |

## Group 3 · Business plumbing: shared tools every module uses

| Service                | In plain words                                      | Everyday example                                                               | How we build it                                                                  |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Workflow and approvals | States a record moves through, and who must approve | Draft, Waiting approval, Approved, Cancelled; above a limit it needs the owner | A generic state machine; each module registers its record types and their states |
| Custom fields          | Extra fields a client adds without code             | A dyeing unit adds "shade number" to a record                                  | A JSON column on each record plus a field-definition table; validated on save    |
| Documents and files    | Storing files and making PDFs                       | Attach a drawing; print a record as a branded PDF                              | Files in object storage (MinIO on our server); PDFs from HTML templates          |
| Numbering              | Unique, gap-free document numbers                   | QT/2026/0042, with a new series each year                                      | A numbering table with row locking so two users never get the same number        |
| Notifications          | Telling people things                               | Email and WhatsApp message when something needs approval                       | A notification service with templates; sending runs as background jobs           |
| Jobs and scheduler     | Work that happens later or on a timer               | Send reminders every morning at 9; generate a big report in the background     | The job queue (chapter 4) with repeatable jobs                                   |

## Group 4 · Operations: keeping it trustworthy and visible

| Service       | In plain words                                | Everyday example                                             | How we build it                                                                       |
| ------------- | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Audit log     | A diary of every change                       | "Rahul changed the price from 100 to 90 on 3 March at 14:02" | Every save writes a before/after entry; entries are never edited                      |
| UI shell      | The frame of the app: menu, header, page area | Switching a module on adds its menu item and pages           | A React app with a slot registry (chapter 9)                                          |
| Observability | Seeing what the system is doing               | Why was this page slow? Which job failed last night?         | Structured logs, metrics and traces with OpenTelemetry, shown in Grafana (chapter 10) |

## How a module uses the kernel

In NestJS, the kernel is a set of shared services that modules receive through **dependency injection**: instead of creating a service itself, a module says "I need the numbering service" in its constructor and NestJS hands it one. That keeps modules simple and lets us swap kernel internals without touching modules.

The direction is one-way: modules depend on the kernel, the kernel never depends on a module. If the kernel ever needs to react to something a module does, it listens to an event.

## Remember

- The kernel is plumbing, not business. No quote, invoice or discount logic lives here.
- Modules lean on the kernel; the kernel never leans on a module.
- Every module announces its permissions, settings and records to the kernel when it is installed.
