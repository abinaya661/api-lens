-- ============================================
-- Migration 006: price_snapshots table
-- Stores per-model pricing in per-million-token format
-- Used by the Cost Estimator and pricing engine
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  model_display   TEXT,
  input_per_mtok  NUMERIC(12, 6) NOT NULL,   -- USD per 1,000,000 input tokens
  output_per_mtok NUMERIC(12, 6) NOT NULL,   -- USD per 1,000,000 output tokens
  unit_type       TEXT NOT NULL DEFAULT 'tokens',
  unit_display    TEXT NOT NULL DEFAULT 'per 1M tokens',
  batch_discount  NUMERIC(5, 4),             -- e.g. 0.5000 = 50% off
  supports_caching BOOLEAN DEFAULT false,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint separately so it works even if table already existed
DO $$ BEGIN
  ALTER TABLE public.price_snapshots ADD CONSTRAINT price_snapshots_provider_model_key UNIQUE (provider, model);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

-- Pricing is public reference data — all authenticated users can read
DO $$ BEGIN
  CREATE POLICY "Anyone can read price snapshots"
    ON public.price_snapshots FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_price_snapshots_provider_model
  ON public.price_snapshots(provider, model);

-- ============================================
-- Seed Data (March 2026 prices)
-- Converted from per-1k to per-million (× 1000)
-- ============================================

-- OpenAI (8 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('openai', 'gpt-4o',        'GPT-4o',        2.500000,  10.000000, true),
  ('openai', 'gpt-4o-mini',   'GPT-4o Mini',   0.150000,   0.600000, true),
  ('openai', 'gpt-4-turbo',   'GPT-4 Turbo',  10.000000,  30.000000, false),
  ('openai', 'gpt-4',         'GPT-4',         30.000000,  60.000000, false),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.500000,   1.500000, false),
  ('openai', 'o1',            'o1',            15.000000,  60.000000, false),
  ('openai', 'o1-mini',       'o1 Mini',        3.000000,  12.000000, false),
  ('openai', 'o3-mini',       'o3 Mini',        1.100000,   4.400000, false)
ON CONFLICT (provider, model) DO NOTHING;

-- Anthropic (5 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('anthropic', 'claude-3-5-sonnet', 'Claude 3.5 Sonnet',  3.000000,  15.000000, true),
  ('anthropic', 'claude-3-5-haiku',  'Claude 3.5 Haiku',   0.800000,   4.000000, true),
  ('anthropic', 'claude-3-opus',     'Claude 3 Opus',      15.000000,  75.000000, true),
  ('anthropic', 'claude-3-sonnet',   'Claude 3 Sonnet',     3.000000,  15.000000, false),
  ('anthropic', 'claude-3-haiku',    'Claude 3 Haiku',      0.250000,   1.250000, true)
ON CONFLICT (provider, model) DO NOTHING;

-- Google Gemini (3 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 0.100000, 0.400000, false),
  ('gemini', 'gemini-1.5-pro',   'Gemini 1.5 Pro',   1.250000, 5.000000, false),
  ('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 0.075000, 0.300000, false)
ON CONFLICT (provider, model) DO NOTHING;

-- Mistral (5 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('mistral', 'mistral-large',  'Mistral Large',  2.000000, 6.000000, false),
  ('mistral', 'mistral-medium', 'Mistral Medium', 2.700000, 8.100000, false),
  ('mistral', 'mistral-small',  'Mistral Small',  1.000000, 3.000000, false),
  ('mistral', 'codestral',      'Codestral',      1.000000, 3.000000, false),
  ('mistral', 'mistral-nemo',   'Mistral Nemo',   0.300000, 0.300000, false)
ON CONFLICT (provider, model) DO NOTHING;

-- Cohere (3 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('cohere', 'command-r-plus', 'Command R+',    3.000000, 15.000000, false),
  ('cohere', 'command-r',      'Command R',     0.500000,  1.500000, false),
  ('cohere', 'command-light',  'Command Light', 0.300000,  0.600000, false)
ON CONFLICT (provider, model) DO NOTHING;

-- AWS Bedrock (4 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('bedrock', 'anthropic.claude-3-5-sonnet', 'Claude 3.5 Sonnet (Bedrock)', 3.000000,  15.000000, false),
  ('bedrock', 'anthropic.claude-3-haiku',    'Claude 3 Haiku (Bedrock)',    0.250000,   1.250000, false),
  ('bedrock', 'amazon.titan-text-express',   'Titan Text Express',          0.200000,   0.600000, false),
  ('bedrock', 'meta.llama3-70b-instruct',    'Llama 3 70B (Bedrock)',       2.650000,   3.500000, false)
ON CONFLICT (provider, model) DO NOTHING;

-- Azure OpenAI (3 models)
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching)
VALUES
  ('azure_openai', 'gpt-4o',      'GPT-4o (Azure)',      2.500000, 10.000000, false),
  ('azure_openai', 'gpt-4o-mini', 'GPT-4o Mini (Azure)', 0.150000,  0.600000, false),
  ('azure_openai', 'gpt-4-turbo', 'GPT-4 Turbo (Azure)', 10.000000, 30.000000, false)
ON CONFLICT (provider, model) DO NOTHING;
