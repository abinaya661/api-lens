-- Migration 011: Adapter Upgrade — Admin Key support, extended usage columns, managed_keys table

-- ─── usage_records: new token breakdown + metadata columns ───────────────────

ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS cached_read_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS input_audio_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_audio_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_source TEXT NOT NULL DEFAULT 'api',
  ADD COLUMN IF NOT EXISTS remote_key_id TEXT;

-- ─── api_keys: track whether this is a standard or admin key ─────────────────

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS key_type TEXT NOT NULL DEFAULT 'standard';

-- ─── managed_keys: child key inventory discovered via admin keys ──────────────

CREATE TABLE IF NOT EXISTS public.managed_keys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_key_id       UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL,
  provider            TEXT NOT NULL,
  remote_key_id       TEXT NOT NULL,
  remote_key_name     TEXT,
  redacted_value      TEXT,
  remote_project_id   TEXT,
  remote_project_name TEXT,
  last_used_at        TIMESTAMPTZ,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_tracked          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_key_id, remote_key_id)
);

ALTER TABLE public.managed_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own managed keys"
  ON public.managed_keys FOR SELECT
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_managed_keys_parent ON public.managed_keys(parent_key_id);

-- ─── usage_records: composite unique index for remote_key_id-aware upserts ───

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_upsert_v2
  ON public.usage_records(key_id, date, model, COALESCE(remote_key_id, ''));
