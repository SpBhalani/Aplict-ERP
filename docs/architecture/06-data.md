# Chapter 6 · Data in PostgreSQL

Each client has one PostgreSQL database; inside it, each module has its own **schema** (a named folder of tables) that no other module touches. Everything in this chapter protects that one rule.

## Database, schema, table: the three levels

| Level    | Think of it as                        | For us                                        |
| -------- | ------------------------------------- | --------------------------------------------- |
| Database | A filing cabinet                      | One per client                                |
| Schema   | A drawer in the cabinet, with a label | One per module, plus `kernel` and `reporting` |
| Table    | A folder in the drawer                | The module's own records                      |

A table's full name includes its drawer: `example.records`, `kernel.users`. Two modules can each have a table called `records` without clashing.

## Rule 1 · Each module owns its schema, enforced by the database

Don't rely only on developers being careful. Give each module its own database login (a **role**) that is allowed into its own schema and nothing else:

```sql
CREATE SCHEMA example;
CREATE ROLE example_module LOGIN PASSWORD '...';
GRANT USAGE, CREATE ON SCHEMA example TO example_module;
-- No grants on other modules' schemas: any attempt to read them fails with an error.
```

In a modular monolith all modules run in one program, so this is optional at first; a simpler start is one database user plus the lint rule from chapter 3. Moving to per-module roles later is easy precisely because modules never shared tables.

## Rule 2 · Refer by ID, not by foreign key

A **foreign key** is a database rule that says "this column must match a row in that other table". Inside one module, use them freely. Across modules, never: a foreign key from one module's table into another's would make the second module impossible to remove.

Instead, store the other module's record ID as a plain column, and when you need details, ask its capability. The owner decides what you may see.

## Rule 3 · Keep a local copy when you read something constantly

If a module shows another module's data on every screen (say, a customer's name), calling a capability every time is wasteful. Instead keep a small **read copy**:

1. The owner publishes `customer.updated` events.
2. Your module listens and updates its own small table with just the fields it needs.
3. Your screens read your own table, fast, with no dependency at read time.

The copy is read-only. Changes always go through the owner. Being a few seconds behind the owner is normal and acceptable for display.

## Rule 4 · Reports read from their own schema

Reports want to combine everything ("sales by customer by month"), which would mean joining many modules' tables. We don't allow that. Instead, a **reporting** schema is filled by event listeners with flat, report-friendly tables, and reports read only from there. As volume grows, this can move to a separate reporting database without changing modules.

## Rule 5 · IDs that are unique everywhere

Use **UUIDv7** (or ULID) instead of numbers counting 1, 2, 3. They are unique across every table, module and client, so records can move between databases or into a future separate service. Version 7 UUIDs also start with the time, so new rows land at the end of the index and inserts stay fast.

Human-friendly numbers like `QT/2026/0042` are separate: the kernel's numbering service generates them as a display field.

## Rule 6 · Get the basic types right from day one

| Thing         | Store it as                                                            | Why                                                                       |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Money         | `numeric(18,4)` plus a currency code, or whole paise/cents in `bigint` | Floating-point numbers round badly; money must be exact                   |
| Quantity      | `numeric` plus a unit code                                             | "10" means nothing without "kg" or "pcs"                                  |
| Date and time | `timestamptz`                                                          | Stores the moment unambiguously; display converts to the user's time zone |
| Custom fields | A `jsonb` column, validated against the field definitions              | Flexible without changing the table; indexable                            |
| Company       | A `company_id` on every business table                                 | Every query filters by company                                            |

## Rule 7 · Each module migrates its own schema

A **migration** is a small, numbered script that changes the database structure ("add column X"). Each module keeps its migrations in its own folder and the loader runs them in order for enabled modules only. Removing a module leaves its schema archived; nothing else is affected.

## Rule 8 · Transactions stay inside one module

A **transaction** is "all of these changes, or none". A module may use one transaction for its own tables plus its outbox row (chapter 4). A single transaction must never span two modules; when a change in one module needs a change in another, it publishes an event and the other module makes its own change.

## Remember

- One database per client, one schema per module, no one reads another's schema.
- Across modules: IDs, not foreign keys; read copies via events; reports from the reporting schema.
- UUIDv7 IDs, exact money, units on quantities, `timestamptz`, `company_id` everywhere.
