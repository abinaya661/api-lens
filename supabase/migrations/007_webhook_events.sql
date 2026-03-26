-- ============================================
-- Migration 007: webhook_events + subscription fixes
-- ============================================

-- Idempotency table for Dodo webhook events (prevents duplicate processing)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  webhook_id   TEXT        PRIMARY KEY,
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write webhook events
CREATE POLICY "Service role manages webhook events"
  ON public.webhook_events FOR ALL
  USING (true);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at DESC);

-- Add payment_method_collected column to subscriptions
-- (used by subscription.trialing webhook event)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_method_collected BOOLEAN NOT NULL DEFAULT FALSE;
