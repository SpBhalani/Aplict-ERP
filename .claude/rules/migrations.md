---
paths:
  - '**/migrations/**'
  - '**/adapters/db/**'
---

# Database tables and migrations

- A migration touches only its own module's schema. Never reference
  another module's schema, tables or columns.
- Never edit a migration that has run anywhere (including CI). Write a new one.
- Every business table has: id (UUIDv7), company_id, created_at, updated_at
  (timestamptz), and a custom_fields jsonb column if it's a record type.
- Money: numeric(18,4) plus a currency column, or bigint minor units.
  Never float, real or double. Quantities always with a unit column.
- Index every table on company_id first, then the common filters.
- No foreign keys to other modules' tables. Foreign keys inside the
  module are fine.
- Each migration has a down step, or a comment explaining why it can't.
- Large data changes go in a background job, not in the migration.
