-- Webhook idempotency tracking
create table if not exists public.webhook_events (
  webhook_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Auto-cleanup index for old events
create index idx_webhook_events_processed_at on public.webhook_events(processed_at);
