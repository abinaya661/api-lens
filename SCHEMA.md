-- ============================================================
-- API Lens — Database Schema v1
-- Paste this ENTIRE file into Supabase SQL Editor and click Run.
-- Run ONCE on a fresh Supabase project. Do NOT run twice.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id           UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name    TEXT,
  avatar_url   TEXT,
  timezone     TEXT NOT NULL DEFAULT 'UTC',
  currency     TEXT NOT NULL DEFAULT 'USD',
  onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
  role         TEXT CHECK (role IN (
                 'solo_developer','startup_team',
                 'agency_freelancer','enterprise','other'
               )),
  company_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: own row"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- PLATFORMS
-- Stored in DB so UI and intelligence panel load from here.
-- Adding a new platform = one INSERT, zero code changes.
-- v2 proxy fields included from day one (null in v1).
-- ============================================================
CREATE TABLE platforms (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL CHECK (category IN (
                         'foundation_model','cloud_ai','inference_gateway',
                         'voice_speech','image_video_multimodal',
                         'embeddings','cloud_billing'
                       )),
  adapter_pattern      INTEGER NOT NULL CHECK (adapter_pattern IN (1,2,3,4)),
  -- Pattern 1: OpenAI-compatible REST  — OpenRouter
  -- Pattern 2: Per-token custom format — OpenAI, Anthropic, Mistral, Cohere
  -- Pattern 3: Per-unit non-token      — ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal
  -- Pattern 4: Cloud billing API       — Gemini, Vertex AI, Azure OpenAI, AWS Bedrock
  auth_type            TEXT NOT NULL CHECK (auth_type IN (
                         'bearer_token','api_key_header',
                         'service_account_json','aws_iam',
                         'azure_api_key','no_auth'
                       )),
  base_url             TEXT,
  pricing_url          TEXT,
  key_page_url         TEXT,
  docs_url             TEXT,
  key_type_description TEXT NOT NULL,
  key_prefix           TEXT,
  avg_monthly_usd_low  NUMERIC(10,2),
  avg_monthly_usd_high NUMERIC(10,2),
  special_warning      TEXT,
  openai_compatible    BOOLEAN NOT NULL DEFAULT FALSE,
  supports_chat        BOOLEAN NOT NULL DEFAULT FALSE,
  supports_embeddings  BOOLEAN NOT NULL DEFAULT FALSE,
  supports_images      BOOLEAN NOT NULL DEFAULT FALSE,
  supports_audio       BOOLEAN NOT NULL DEFAULT FALSE,
  supports_video       BOOLEAN NOT NULL DEFAULT FALSE,
  supports_fine_tuning BOOLEAN NOT NULL DEFAULT FALSE,
  unit_type            TEXT NOT NULL DEFAULT 'tokens' CHECK (unit_type IN (
                         'tokens','characters','minutes','seconds',
                         'images','compute_seconds','requests'
                       )),
  color                TEXT NOT NULL DEFAULT '#6b7280',
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  requires_base_url    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_project_id  BOOLEAN NOT NULL DEFAULT FALSE,
  requires_region      BOOLEAN NOT NULL DEFAULT FALSE,
  has_usage_api        BOOLEAN NOT NULL DEFAULT FALSE,
  sync_delay_minutes   INTEGER NOT NULL DEFAULT 0,
  -- v2 proxy fields — schema ready, populated in v2
  proxy_path_prefix    TEXT,
  proxy_supported      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platforms: authenticated read"
  ON platforms FOR SELECT TO authenticated USING (TRUE);

-- ============================================================
-- SEED — 14 v1 platforms
-- ============================================================
INSERT INTO platforms
  (id, name, category, adapter_pattern, auth_type,
   base_url, pricing_url, key_page_url, docs_url,
   key_type_description, key_prefix,
   avg_monthly_usd_low, avg_monthly_usd_high, special_warning,
   openai_compatible,
   supports_chat, supports_embeddings, supports_images,
   supports_audio, supports_video, supports_fine_tuning,
   unit_type, color,
   requires_base_url, requires_project_id, requires_region,
   has_usage_api, sync_delay_minutes)
VALUES

-- PATTERN 2: Per-token

('openai','OpenAI','foundation_model',2,'api_key_header',
 'https://api.openai.com/v1',
 'https://openai.com/pricing',
 'https://platform.openai.com/api-keys',
 'https://platform.openai.com/docs',
 'Admin Keys give read access to your organisation billing and usage data. This is the only key type that allows API Lens to pull your real spend automatically. Regular project keys (sk-proj-...) cannot access usage data.',
 'sk-admin-',20,200,
 '⚠️ You need an Admin Key (sk-admin-...) not a regular API key. Go to platform.openai.com → Settings → API Keys → Create Admin Key.',
 FALSE,TRUE,TRUE,TRUE,TRUE,FALSE,TRUE,'tokens','#10a37f',
 FALSE,FALSE,FALSE,TRUE,5),

('anthropic','Anthropic','foundation_model',2,'api_key_header',
 'https://api.anthropic.com',
 'https://anthropic.com/pricing',
 'https://console.anthropic.com/settings/keys',
 'https://docs.anthropic.com',
 'Admin API Keys give access to your organisation usage reports. API Lens uses this to pull your daily token usage and calculate your exact spend per model.',
 'sk-ant-',15,150,
 '⚠️ You need an Admin Key from console.anthropic.com. Go to Settings → API Keys and create a key with usage read permissions.',
 FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,'tokens','#d97706',
 FALSE,FALSE,FALSE,TRUE,0),

('mistral','Mistral AI','foundation_model',2,'bearer_token',
 'https://api.mistral.ai/v1',
 'https://mistral.ai/pricing',
 'https://console.mistral.ai/api-keys/',
 'https://docs.mistral.ai',
 'Standard Mistral API Key. API Lens calls the Mistral usage history endpoint to pull your daily spend automatically.',
 NULL,10,80,NULL,
 FALSE,TRUE,TRUE,FALSE,FALSE,FALSE,TRUE,'tokens','#7c3aed',
 FALSE,FALSE,FALSE,TRUE,60),

('cohere','Cohere','foundation_model',2,'bearer_token',
 'https://api.cohere.com/v1',
 'https://cohere.com/pricing',
 'https://dashboard.cohere.com/api-keys',
 'https://docs.cohere.com',
 'Standard Cohere API Key. API Lens calls the Cohere usage endpoint to pull your monthly spend breakdown automatically.',
 NULL,5,50,NULL,
 FALSE,TRUE,TRUE,FALSE,FALSE,FALSE,TRUE,'tokens','#39d353',
 FALSE,FALSE,FALSE,TRUE,1440),

-- PATTERN 1: OpenAI-compatible

('openrouter','OpenRouter','inference_gateway',1,'bearer_token',
 'https://openrouter.ai/api/v1',
 'https://openrouter.ai/models',
 'https://openrouter.ai/keys',
 'https://openrouter.ai/docs',
 'OpenRouter gives you access to 200+ models from all providers with one key. API Lens tracks your daily credit spend by comparing your balance once per day.',
 'sk-or-',10,100,NULL,
 TRUE,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,'tokens','#6366f1',
 FALSE,FALSE,FALSE,FALSE,1440),

-- PATTERN 4: Cloud billing

('gemini','Google Gemini','foundation_model',4,'api_key_header',
 'https://generativelanguage.googleapis.com',
 'https://ai.google.dev/pricing',
 'https://aistudio.google.com/app/apikey',
 'https://ai.google.dev/docs',
 'Gemini API Key from Google AI Studio. API Lens pulls your token usage via Google Cloud Monitoring. Cost data is typically available within 3 hours.',
 'AIza',10,100,
 '⚠️ Cost data has a 3-hour delay from Google Cloud. This is a Google limitation — API Lens syncs as soon as data is available.',
 FALSE,TRUE,FALSE,TRUE,TRUE,FALSE,TRUE,'tokens','#4285f4',
 FALSE,TRUE,FALSE,TRUE,180),

('vertex_ai','Google Vertex AI','cloud_ai',4,'service_account_json',
 'https://us-central1-aiplatform.googleapis.com',
 'https://cloud.google.com/vertex-ai/pricing',
 'https://console.cloud.google.com/iam-admin/serviceaccounts',
 'https://cloud.google.com/vertex-ai/docs',
 'Service Account JSON key from GCP Console. Requires roles/monitoring.viewer and roles/bigquery.dataViewer. API Lens pulls token counts via Cloud Monitoring.',
 NULL,50,500,
 '⚠️ Cost data has a 24-48 hour delay — this is a Google Cloud limitation. Requires Service Account JSON, not a simple API key.',
 FALSE,TRUE,FALSE,TRUE,TRUE,FALSE,TRUE,'tokens','#34a853',
 FALSE,TRUE,FALSE,TRUE,2880),

('azure_openai','Azure OpenAI','cloud_ai',4,'azure_api_key',
 NULL,
 'https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/',
 'https://portal.azure.com/',
 'https://learn.microsoft.com/azure/ai-services/openai/',
 'Azure API Key from Azure Portal. You also need your resource Endpoint URL. API Lens pulls token usage via Azure Monitor Metrics.',
 NULL,30,300,
 '⚠️ You need two things: your API Key AND your Endpoint URL. Both are in Azure Portal → Cognitive Services → Your Resource → Keys and Endpoint.',
 FALSE,TRUE,TRUE,FALSE,FALSE,FALSE,TRUE,'tokens','#0078d4',
 TRUE,FALSE,FALSE,TRUE,60),

('bedrock','Amazon Bedrock','cloud_ai',4,'aws_iam',
 NULL,
 'https://aws.amazon.com/bedrock/pricing/',
 'https://console.aws.amazon.com/iam/',
 'https://docs.aws.amazon.com/bedrock/',
 'IAM Access Key ID and Secret Access Key with two permissions only: ce:GetCostAndUsage and cloudwatch:GetMetricData. API Lens pulls your exact daily cost from AWS Cost Explorer.',
 'AKIA',20,200,
 '⚠️ Create a dedicated IAM user with ONLY ce:GetCostAndUsage and cloudwatch:GetMetricData permissions. Never use your root AWS credentials.',
 FALSE,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,'tokens','#ff9900',
 FALSE,FALSE,TRUE,TRUE,1440),

-- PATTERN 3: Per-unit

('elevenlabs','ElevenLabs','voice_speech',3,'api_key_header',
 'https://api.elevenlabs.io/v1',
 'https://elevenlabs.io/pricing',
 'https://elevenlabs.io/app/settings/api-keys',
 'https://elevenlabs.io/docs',
 'ElevenLabs API Key for voice synthesis. Charged per character of text converted to speech. API Lens fetches your generation history and calculates your exact cost.',
 NULL,10,80,
 '⚠️ ElevenLabs charges per character of text-to-speech generated, not per token. Your dashboard shows characters used and cost.',
 FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,'characters','#f97316',
 FALSE,FALSE,FALSE,TRUE,0),

('deepgram','Deepgram','voice_speech',3,'bearer_token',
 'https://api.deepgram.com/v1',
 'https://deepgram.com/pricing',
 'https://console.deepgram.com/',
 'https://developers.deepgram.com',
 'Deepgram API Key for speech-to-text transcription. Charged per minute of audio transcribed. API Lens fetches your request history and calculates your exact cost per minute.',
 NULL,5,50,
 '⚠️ Deepgram charges per minute of audio transcribed, not per token. Your dashboard shows minutes transcribed and cost.',
 FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,'minutes','#06b6d4',
 FALSE,FALSE,FALSE,TRUE,0),

('assemblyai','AssemblyAI','voice_speech',3,'api_key_header',
 'https://api.assemblyai.com/v2',
 'https://www.assemblyai.com/pricing',
 'https://www.assemblyai.com/app/account',
 'https://www.assemblyai.com/docs',
 'AssemblyAI API Key for speech-to-text and audio intelligence. Charged per minute of audio. API Lens fetches your usage and calculates your exact cost per minute.',
 NULL,5,40,NULL,
 FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,'minutes','#3b82f6',
 FALSE,FALSE,FALSE,TRUE,0),

('replicate','Replicate','image_video_multimodal',3,'bearer_token',
 'https://api.replicate.com/v1',
 'https://replicate.com/pricing',
 'https://replicate.com/account/api-tokens',
 'https://replicate.com/docs',
 'Replicate API Token for running AI models. Charged per second of GPU compute. API Lens fetches your prediction history and Replicate provides the exact cost per prediction.',
 'r8_',10,100,
 '⚠️ Replicate charges per GPU compute second, not per token. Your dashboard shows compute seconds used and exact cost as reported by Replicate.',
 FALSE,FALSE,FALSE,TRUE,TRUE,TRUE,FALSE,'compute_seconds','#0ea5e9',
 FALSE,FALSE,FALSE,TRUE,0),

('fal','Fal AI','image_video_multimodal',3,'api_key_header',
 'https://fal.run',
 'https://fal.ai/pricing',
 'https://fal.ai/dashboard/keys',
 'https://docs.fal.ai',
 'Fal API Key for image and video generation models including FLUX. API Lens fetches your daily usage and Fal provides the exact USD cost directly in their API response.',
 'fal-',10,80,NULL,
 FALSE,FALSE,FALSE,TRUE,FALSE,TRUE,FALSE,'images','#f59e0b',
 FALSE,FALSE,FALSE,TRUE,0);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_customer_id     TEXT,
  razorpay_subscription_id TEXT UNIQUE,
  plan                     TEXT NOT NULL DEFAULT 'trial'
                           CHECK (plan IN ('trial','pro','annual','cancelled','expired','paused')),
  billing_cycle            TEXT CHECK (billing_cycle IN ('monthly','annual')),
  trial_ends_at            TIMESTAMPTZ,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: own row"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (CHAR_LENGTH(name) BETWEEN 1 AND 100),
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#4f46e5',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: own rows"
  ON projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_projects_user ON projects(user_id, is_active);

-- ============================================================
-- API KEYS — encrypted key storage
-- provider is a plain text reference to platforms.id.
-- Not a FK so adding platforms later = zero schema migration.
-- ============================================================
CREATE TABLE api_keys (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider             TEXT NOT NULL,
  nickname             TEXT NOT NULL CHECK (CHAR_LENGTH(nickname) BETWEEN 1 AND 100),
  encrypted_key        TEXT NOT NULL,
  key_hint             TEXT NOT NULL CHECK (CHAR_LENGTH(key_hint) = 4),
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_valid             BOOLEAN NOT NULL DEFAULT TRUE,
  last_validated       TIMESTAMPTZ,
  last_used            TIMESTAMPTZ,
  rotation_due         TIMESTAMPTZ,
  notes                TEXT,
  endpoint_url         TEXT,
  -- endpoint_url usage:
  --   Azure OpenAI:  resource endpoint URL
  --   Gemini/Vertex: GCP project ID
  --   AWS Bedrock:   AWS region (e.g. us-east-1)
  --   OpenRouter:    JSON blob storing credit balance for daily diff
  detected_pattern     INTEGER CHECK (detected_pattern IN (1,2,3,4)),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_failure_reason  TEXT,
  has_usage_api        BOOLEAN NOT NULL DEFAULT FALSE,
  -- v2 proxy fields — schema ready, populated in v2
  proxy_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  proxy_key_id         TEXT UNIQUE,
  -- proxy_key_id: public identifier users put in their code.
  -- Maps to the real encrypted_key on our side. Never expose encrypted_key through proxy.
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys: own rows"
  ON api_keys FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_api_keys_user     ON api_keys(user_id, is_active);
CREATE INDEX idx_api_keys_provider ON api_keys(user_id, provider);
CREATE INDEX idx_api_keys_pattern  ON api_keys(detected_pattern, is_active, is_valid);

-- ============================================================
-- PROJECT KEYS — many-to-many: keys ↔ projects
-- One key can belong to multiple projects.
-- ============================================================
CREATE TABLE project_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_id      UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, key_id)
);

ALTER TABLE project_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_keys: via project ownership"
  ON project_keys FOR ALL
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

-- ============================================================
-- USAGE RECORDS — daily spend per key per model
--
-- CRITICAL DESIGN RULE:
-- cost_usd is ALWAYS calculated and stored at sync time.
-- All queries sum cost_usd — no conditional logic on unit_type.
-- unit_type and unit_count exist for display context only.
-- This means budgets, alerts, and charts work identically
-- for all 14 platforms regardless of what they measure.
-- ============================================================
CREATE TABLE usage_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id        UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL DEFAULT 'unknown',
  input_tokens  BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens  BIGINT NOT NULL DEFAULT 0,
  unit_type     TEXT NOT NULL DEFAULT 'tokens' CHECK (unit_type IN (
                  'tokens','characters','minutes','seconds',
                  'images','compute_seconds','requests'
                )),
  unit_count    BIGINT NOT NULL DEFAULT 0,
  -- unit_count interpretation:
  --   tokens:          same as total_tokens
  --   characters:      chars of TTS generated (ElevenLabs)
  --   minutes:         minutes of audio transcribed (Deepgram, AssemblyAI)
  --   images:          images/videos generated (Fal AI)
  --   compute_seconds: GPU seconds used (Replicate)
  cost_usd      NUMERIC(12,8) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  -- v2 proxy fields — schema ready, null in v1
  source            TEXT NOT NULL DEFAULT 'pull'
                    CHECK (source IN ('pull','proxy','manual','reconciled')),
  proxy_request_id  TEXT,
  project_feature   TEXT,
  end_user_id       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key_id, date, model)
);

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_records: own rows"
  ON usage_records FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_usage_user_date ON usage_records(user_id, date DESC);
CREATE INDEX idx_usage_key_date  ON usage_records(key_id, date DESC);
CREATE INDEX idx_usage_user_prov ON usage_records(user_id, provider, date DESC);

-- ============================================================
-- BUDGETS — spending limits at any scope
-- ============================================================
CREATE TABLE budgets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope                  TEXT NOT NULL CHECK (scope IN ('global','platform','project','key')),
  scope_id               UUID,
  platform               TEXT,
  amount_usd             NUMERIC(10,2) NOT NULL CHECK (amount_usd > 0),
  period                 TEXT NOT NULL DEFAULT 'monthly',
  alert_50               BOOLEAN NOT NULL DEFAULT TRUE,
  alert_75               BOOLEAN NOT NULL DEFAULT TRUE,
  alert_90               BOOLEAN NOT NULL DEFAULT TRUE,
  alert_100              BOOLEAN NOT NULL DEFAULT TRUE,
  last_alerted_threshold INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets: own rows"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ALERTS — notification history and in-app feed
-- ============================================================
CREATE TABLE alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'budget_50','budget_75','budget_90','budget_100',
               'spike','waste','rotation','price_change',
               'key_invalid','sync_failed'
             )),
  scope      TEXT CHECK (scope IN ('global','project','key','platform')),
  scope_id   UUID,
  scope_name TEXT,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  is_emailed BOOLEAN NOT NULL DEFAULT FALSE,
  severity   TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','danger')),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts: own rows"
  ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read, created_at DESC);

-- ============================================================
-- PRICE SNAPSHOTS — current pricing per model per platform
--
-- input_per_mtok interpretation by unit_type:
--   tokens:          USD per 1M tokens
--   characters:      USD per 1M characters
--   minutes:         USD per minute  (NOT per million)
--   images:          USD per image
--   compute_seconds: USD per compute second  (NOT per million)
-- ============================================================
CREATE TABLE price_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         TEXT NOT NULL,
  model            TEXT NOT NULL,
  model_display    TEXT,
  input_per_mtok   NUMERIC(10,6) NOT NULL,
  output_per_mtok  NUMERIC(10,6) NOT NULL,
  unit_type        TEXT NOT NULL DEFAULT 'tokens' CHECK (unit_type IN (
                     'tokens','characters','minutes','seconds',
                     'images','compute_seconds','requests'
                   )),
  unit_display     TEXT NOT NULL DEFAULT 'per 1M tokens',
  batch_discount   NUMERIC(4,2),
  supports_caching BOOLEAN DEFAULT FALSE,
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO price_snapshots
  (provider, model, model_display, input_per_mtok, output_per_mtok,
   unit_type, unit_display, batch_discount, supports_caching)
VALUES
  -- OpenAI
  ('openai','gpt-4o',          'GPT-4o',      2.50, 10.00,'tokens','per 1M tokens',0.50,TRUE),
  ('openai','gpt-4o-mini',     'GPT-4o Mini', 0.15,  0.60,'tokens','per 1M tokens',0.50,FALSE),
  ('openai','o3',              'o3',           2.00,  8.00,'tokens','per 1M tokens',0.50,FALSE),
  ('openai','o4-mini',         'o4-mini',      1.10,  4.40,'tokens','per 1M tokens',0.50,FALSE),

  -- Anthropic
  ('anthropic','claude-opus-4-6',  'Claude Opus 4.6',   5.00, 25.00,'tokens','per 1M tokens',0.50,TRUE),
  ('anthropic','claude-sonnet-4-6','Claude Sonnet 4.6', 3.00, 15.00,'tokens','per 1M tokens',0.50,TRUE),
  ('anthropic','claude-haiku-4-5', 'Claude Haiku 4.5',  1.00,  5.00,'tokens','per 1M tokens',0.50,TRUE),
  ('anthropic','claude-haiku-3',   'Claude Haiku 3',    0.25,  1.25,'tokens','per 1M tokens',0.50,TRUE),

  -- Mistral
  ('mistral','mistral-large-latest','Mistral Large', 2.00,6.00,'tokens','per 1M tokens',NULL,FALSE),
  ('mistral','mistral-medium',      'Mistral Medium',0.40,1.20,'tokens','per 1M tokens',NULL,FALSE),
  ('mistral','mistral-small',       'Mistral Small', 0.10,0.30,'tokens','per 1M tokens',NULL,FALSE),
  ('mistral','codestral-latest',    'Codestral',     0.30,0.90,'tokens','per 1M tokens',NULL,FALSE),

  -- Cohere
  ('cohere','command-r-plus',   'Command R+',      2.50,10.00,'tokens','per 1M tokens',NULL,FALSE),
  ('cohere','command-r',        'Command R',       0.15, 0.60,'tokens','per 1M tokens',NULL,FALSE),
  ('cohere','embed-english-v3', 'Embed English v3',0.10, 0.00,'tokens','per 1M tokens',NULL,FALSE),

  -- OpenRouter
  ('openrouter','openai/gpt-4o',               'GPT-4o via OpenRouter',           2.50,10.00,'tokens','per 1M tokens',NULL,FALSE),
  ('openrouter','anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet via OpenRouter', 3.00,15.00,'tokens','per 1M tokens',NULL,FALSE),
  ('openrouter','google/gemini-2.5-pro',       'Gemini 2.5 Pro via OpenRouter',    1.25,10.00,'tokens','per 1M tokens',NULL,FALSE),

  -- Google Gemini
  ('gemini','gemini-2.5-pro',       'Gemini 2.5 Pro',        1.25,10.00,'tokens','per 1M tokens',0.50,TRUE),
  ('gemini','gemini-2.5-flash',     'Gemini 2.5 Flash',      0.30, 2.50,'tokens','per 1M tokens',0.50,FALSE),
  ('gemini','gemini-2.5-flash-lite','Gemini 2.5 Flash-Lite', 0.10, 0.40,'tokens','per 1M tokens',0.50,FALSE),

  -- Google Vertex AI
  ('vertex_ai','gemini-2.5-pro',  'Gemini 2.5 Pro (Vertex)',  1.25,10.00,'tokens','per 1M tokens',NULL,TRUE),
  ('vertex_ai','gemini-2.5-flash','Gemini 2.5 Flash (Vertex)',0.30, 2.50,'tokens','per 1M tokens',NULL,FALSE),

  -- Azure OpenAI
  ('azure_openai','gpt-4o',     'GPT-4o (Azure)',      2.50,10.00,'tokens','per 1M tokens',NULL,FALSE),
  ('azure_openai','gpt-4o-mini','GPT-4o Mini (Azure)', 0.15, 0.60,'tokens','per 1M tokens',NULL,FALSE),

  -- AWS Bedrock
  ('bedrock','anthropic.claude-3-5-sonnet-20241022-v2:0','Claude 3.5 Sonnet',3.00,15.00,'tokens','per 1M tokens',NULL,FALSE),
  ('bedrock','anthropic.claude-3-haiku-20240307-v1:0',   'Claude 3 Haiku',   0.25, 1.25,'tokens','per 1M tokens',NULL,FALSE),
  ('bedrock','meta.llama3-70b-instruct-v1:0',            'Llama 3 70B',      2.65, 3.50,'tokens','per 1M tokens',NULL,FALSE),
  ('bedrock','amazon.titan-text-express-v1',             'Titan Text Express',0.20, 0.60,'tokens','per 1M tokens',NULL,FALSE),

  -- ElevenLabs (price per 1M characters)
  ('elevenlabs','eleven_multilingual_v2','Multilingual v2',0.30,0.00,'characters','per 1M characters',NULL,FALSE),
  ('elevenlabs','eleven_turbo_v2_5',     'Turbo v2.5',     0.15,0.00,'characters','per 1M characters',NULL,FALSE),
  ('elevenlabs','eleven_flash_v2_5',     'Flash v2.5',     0.08,0.00,'characters','per 1M characters',NULL,FALSE),

  -- Deepgram (price per minute)
  ('deepgram','nova-2',        'Nova-2',        0.0043,0.00,'minutes','per minute',NULL,FALSE),
  ('deepgram','nova-2-medical','Nova-2 Medical',0.0086,0.00,'minutes','per minute',NULL,FALSE),
  ('deepgram','whisper-large', 'Whisper Large', 0.0048,0.00,'minutes','per minute',NULL,FALSE),
  ('deepgram','nova-2-meeting','Nova-2 Meeting',0.0069,0.00,'minutes','per minute',NULL,FALSE),

  -- AssemblyAI (price per minute)
  ('assemblyai','best',  'Best (most accurate)',0.0062,0.00,'minutes','per minute',NULL,FALSE),
  ('assemblyai','nano',  'Nano (fastest)',      0.0020,0.00,'minutes','per minute',NULL,FALSE),
  ('assemblyai','slam-1','SLAM-1',              0.0040,0.00,'minutes','per minute',NULL,FALSE),

  -- Replicate (price per compute second)
  ('replicate','meta/llama-3-8b-instruct',     'Llama 3 8B', 0.000055,0.00,'compute_seconds','per compute second',NULL,FALSE),
  ('replicate','stability-ai/sdxl',            'SDXL',       0.000975,0.00,'compute_seconds','per compute second',NULL,FALSE),
  ('replicate','black-forest-labs/flux-schnell','FLUX Schnell',0.000400,0.00,'compute_seconds','per compute second',NULL,FALSE),

  -- Fal AI (price per image)
  ('fal','fal-ai/flux/dev',                              'FLUX Dev',    0.025,0.00,'images','per image',NULL,FALSE),
  ('fal','fal-ai/flux/schnell',                          'FLUX Schnell',0.003,0.00,'images','per image',NULL,FALSE),
  ('fal','fal-ai/stable-diffusion-v3-medium',            'SD3 Medium',  0.035,0.00,'images','per image',NULL,FALSE),
  ('fal','fal-ai/kling-video/v1/standard/text-to-video', 'Kling Video', 0.140,0.00,'images','per video',NULL,FALSE);

-- ============================================================
-- SAVED ESTIMATES — from cost estimator feature
-- ============================================================
CREATE TABLE saved_estimates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id            UUID REFERENCES projects(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  provider              TEXT NOT NULL,
  model                 TEXT NOT NULL,
  messages_per_day      INTEGER NOT NULL,
  avg_input_tokens      INTEGER NOT NULL,
  avg_output_tokens     INTEGER NOT NULL,
  num_users             INTEGER NOT NULL DEFAULT 1,
  use_batch             BOOLEAN NOT NULL DEFAULT FALSE,
  projected_monthly_usd NUMERIC(10,2),
  actual_monthly_usd    NUMERIC(10,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE saved_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_estimates: own rows"
  ON saved_estimates FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- RECONCILIATION LOGS — v1 schema ready, populated in v2
-- Compares proxy-tracked cost vs official platform cost.
-- ============================================================
CREATE TABLE reconciliation_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_id            uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  date              date NOT NULL,
  proxied_cost_usd  NUMERIC(12,8) NOT NULL DEFAULT 0,
  official_cost_usd NUMERIC(12,8) NOT NULL DEFAULT 0,
  gap_usd           NUMERIC(12,8) GENERATED ALWAYS AS
                    (official_cost_usd - proxied_cost_usd) STORED,
  gap_percent       NUMERIC(6,2) GENERATED ALWAYS AS (
                    CASE WHEN official_cost_usd = 0 THEN 0
                    ELSE ROUND(((official_cost_usd - proxied_cost_usd)
                    / official_cost_usd) * 100, 2) END) STORED,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reconciled','flagged')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key_id, date)
);

ALTER TABLE reconciliation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reconciliation_logs: own rows"
  ON reconciliation_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_recon_user_date ON reconciliation_logs(user_id, date DESC);

-- ============================================================
-- UPDATED_AT TRIGGER — applied to all tables with updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at();