-- Kernel migration 0001: event outbox and processed-event dedup history.
-- kernel.schema_migrations is bootstrapped directly by migrate.ts (it must
-- exist before this file, or any file, can be looked up), so it is not
-- created here.

CREATE TABLE kernel.outbox (
  id uuid primary key,
  type text not null,
  version integer not null,
  company_id uuid not null,
  actor text not null,
  correlation_id uuid not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  published_at timestamptz
);

CREATE INDEX outbox_unpublished_idx ON kernel.outbox (occurred_at) WHERE published_at IS NULL;

CREATE TABLE kernel.processed_events (
  subscriber text not null,
  event_id uuid not null,
  processed_at timestamptz not null default now(),
  primary key (subscriber, event_id)
);

-- No down step: dropping these tables would discard undelivered outbox
-- events and the processed-events dedup history, which is never safe.
