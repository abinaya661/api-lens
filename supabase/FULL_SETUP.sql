-- ============================================
-- API Lens — FULL Supabase Setup
-- Run this in the SQL Editor of a NEW Supabase project
-- Run in ONE go (top to bottom)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.provider_type AS ENUM (
  'openai', 'anthropic', 'gemini', 'bedrock',
  'mistral', 'cohere', 'azure_openai', 'custom'
);

CREATE TYPE public.key_health AS ENUM (
  'active', 'invalid', 'sync_error', 'inactive'
);

CREATE TYPE public.budget_scope AS ENUM (
  'global', 'platform', 'project', 'key'
);

CREATE TYPE public.alert_type AS ENUM (
  'budget_threshold', 'spend_spike', 'key_inactive',
  'key_rotation_due', 'custom_cost_reminder'
);

CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email');

CREATE TYPE public.subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'cancelled'
);

CREATE TYPE public.plan_type AS ENUM ('monthly', 'annual');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name    TEXT,
  company_name TEXT,
  email        TEXT,
  avatar_url   TEXT,
  timezone     TEXT,
  currency     TEXT,
  role         TEXT,
  onboarded    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================
-- 2. COMPANIES (legacy, still used by trigger)
-- ============================================
CREATE TABLE public.companies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own company" ON public.companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 3. PROJECTS
-- ============================================
CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. API KEYS
-- ============================================
CREATE TABLE public.api_keys (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider              public.provider_type NOT NULL,
  nickname              TEXT NOT NULL,
  encrypted_key         TEXT NOT NULL,
  key_hint              TEXT NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  is_valid              BOOLEAN NOT NULL DEFAULT true,
  health                public.key_health NOT NULL DEFAULT 'active',
  last_used             TIMESTAMPTZ,
  last_validated        TIMESTAMPTZ,
  last_synced_at        TIMESTAMPTZ,
  last_error            TEXT,
  last_failure_reason   TEXT,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  rotation_due          TIMESTAMPTZ,
  has_usage_api         BOOLEAN NOT NULL DEFAULT false,
  proxy_enabled         BOOLEAN NOT NULL DEFAULT false,
  proxy_key_id          UUID,
  endpoint_url          TEXT,
  detected_pattern      INTEGER,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keys" ON public.api_keys
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own keys" ON public.api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own keys" ON public.api_keys
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own keys" ON public.api_keys
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_api_keys_active_provider ON public.api_keys (is_active, provider)
  WHERE is_active = true;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. PROJECT KEYS (join table)
-- ============================================
CREATE TABLE public.project_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key_id      UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, key_id)
);

ALTER TABLE public.project_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project keys" ON public.project_keys
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own project keys" ON public.project_keys
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own project keys" ON public.project_keys
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- ============================================
-- 6. USAGE RECORDS
-- ============================================
CREATE TABLE public.usage_records (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id           UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,
  provider         public.provider_type NOT NULL,
  model            TEXT NOT NULL,
  input_tokens     BIGINT NOT NULL DEFAULT 0,
  output_tokens    BIGINT NOT NULL DEFAULT 0,
  total_tokens     BIGINT,
  unit_type        TEXT,
  unit_count       INTEGER,
  cost_usd         NUMERIC(12, 6) NOT NULL DEFAULT 0,
  request_count    INTEGER DEFAULT 1,
  source           TEXT,
  proxy_request_id UUID,
  project_feature  TEXT,
  end_user_id      TEXT,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usage_records_key_id_date_model_key UNIQUE (key_id, date, model)
);

CREATE INDEX idx_usage_key_recorded ON public.usage_records(key_id, recorded_at DESC);
CREATE INDEX idx_usage_recorded_at ON public.usage_records(recorded_at DESC);
CREATE INDEX idx_usage_records_user_date ON public.usage_records(user_id, date);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.usage_records
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own usage" ON public.usage_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. BUDGETS
-- ============================================
CREATE TABLE public.budgets (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope                  public.budget_scope NOT NULL,
  scope_id               TEXT,
  platform               TEXT,
  amount_usd             NUMERIC(12, 2) NOT NULL,
  period                 TEXT NOT NULL DEFAULT 'monthly',
  alert_50               BOOLEAN NOT NULL DEFAULT true,
  alert_75               BOOLEAN NOT NULL DEFAULT true,
  alert_90               BOOLEAN NOT NULL DEFAULT true,
  alert_100              BOOLEAN NOT NULL DEFAULT true,
  last_alerted_threshold INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scope, scope_id)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ALERTS
-- ============================================
CREATE TABLE public.alerts (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type               public.alert_type NOT NULL,
  severity           public.alert_severity NOT NULL DEFAULT 'info',
  scope              TEXT,
  scope_id           TEXT,
  scope_name         TEXT,
  title              TEXT NOT NULL,
  message            TEXT NOT NULL,
  is_read            BOOLEAN NOT NULL DEFAULT false,
  is_emailed         BOOLEAN NOT NULL DEFAULT false,
  metadata           JSONB,
  related_key_id     UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  related_budget_id  UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_created ON public.alerts(user_id, created_at DESC);

-- Prevent duplicate budget threshold alerts
CREATE UNIQUE INDEX idx_alerts_budget_threshold
  ON public.alerts (user_id, type, scope, scope_id, title)
  WHERE type = 'budget_threshold';

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id  UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel   public.notification_channel NOT NULL,
  recipient TEXT NOT NULL,
  sent_at   TIMESTAMPTZ,
  delivered BOOLEAN NOT NULL DEFAULT false,
  error     TEXT
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (false);

-- ============================================
-- 10. MODEL PRICING
-- ============================================
CREATE TABLE public.model_pricing (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider          public.provider_type NOT NULL,
  model_id          TEXT NOT NULL,
  model_name        TEXT NOT NULL,
  input_price_per_1k  NUMERIC(10, 6) NOT NULL,
  output_price_per_1k NUMERIC(10, 6) NOT NULL,
  effective_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_current        BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_pricing_provider_model ON public.model_pricing(provider, model_id, is_current);

ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing" ON public.model_pricing
  FOR SELECT USING (true);

-- ============================================
-- 11. PRICE SNAPSHOTS
-- ============================================
CREATE TABLE public.price_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  model_display   TEXT,
  input_per_mtok  NUMERIC(12, 6) NOT NULL,
  output_per_mtok NUMERIC(12, 6) NOT NULL,
  unit_type       TEXT NOT NULL DEFAULT 'tokens',
  unit_display    TEXT NOT NULL DEFAULT 'per 1M tokens',
  batch_discount  NUMERIC(5, 4),
  supports_caching BOOLEAN DEFAULT false,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, model)
);

ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price snapshots" ON public.price_snapshots
  FOR SELECT USING (true);

CREATE INDEX idx_price_snapshots_provider_model ON public.price_snapshots(provider, model);

-- ============================================
-- 12. COST ESTIMATES
-- ============================================
CREATE TABLE public.cost_estimates (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id               UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  provider                 public.provider_type NOT NULL,
  model                    TEXT NOT NULL,
  messages_per_day         INTEGER NOT NULL,
  tokens_per_message       INTEGER NOT NULL,
  avg_input_tokens         INTEGER,
  avg_output_tokens        INTEGER,
  users                    INTEGER NOT NULL DEFAULT 1,
  num_users                INTEGER,
  use_batch                BOOLEAN DEFAULT false,
  estimated_monthly_cost_usd NUMERIC(12, 2) NOT NULL,
  projected_monthly_usd    NUMERIC(12, 2),
  actual_monthly_usd       NUMERIC(12, 2),
  name                     TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create estimates" ON public.cost_estimates
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own estimates" ON public.cost_estimates
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- ============================================
-- 13. SAVED ESTIMATES
-- ============================================
CREATE TABLE public.saved_estimates (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id           UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  model                TEXT NOT NULL,
  messages_per_day     INTEGER NOT NULL,
  avg_input_tokens     INTEGER NOT NULL,
  avg_output_tokens    INTEGER NOT NULL,
  num_users            INTEGER NOT NULL,
  use_batch            BOOLEAN NOT NULL DEFAULT false,
  projected_monthly_usd NUMERIC(12, 2),
  actual_monthly_usd   NUMERIC(12, 2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved estimates" ON public.saved_estimates
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- 14. SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status                public.subscription_status NOT NULL DEFAULT 'trialing',
  plan                  public.plan_type DEFAULT 'monthly',
  trial_ends_at         TIMESTAMPTZ,
  dodo_subscription_id  TEXT UNIQUE,
  dodo_customer_id      TEXT,
  period_end            TIMESTAMPTZ,
  last_payment_at       TIMESTAMPTZ,
  grace_period_ends_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_dodo_id ON public.subscriptions(dodo_subscription_id)
  WHERE dodo_subscription_id IS NOT NULL;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (false);
CREATE POLICY "update_subscription" ON public.subscriptions
  FOR UPDATE USING (false);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 15. AUDIT LOG
-- ============================================
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (false);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- ============================================
-- 16. ACCESS PASSES
-- ============================================
CREATE TABLE public.access_passes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  description  TEXT,
  pass_type    TEXT NOT NULL CHECK (pass_type IN ('15_day', '30_day')),
  max_uses     INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.access_pass_redemptions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pass_id          UUID REFERENCES public.access_passes(id),
  user_id          UUID REFERENCES auth.users(id),
  redeemed_at      TIMESTAMPTZ DEFAULT NOW(),
  trial_extended_to TIMESTAMPTZ NOT NULL,
  UNIQUE (pass_id, user_id)
);

ALTER TABLE public.access_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_pass_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_active_passes" ON public.access_passes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
CREATE POLICY "insert_redemptions" ON public.access_pass_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "read_own_redemptions" ON public.access_pass_redemptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 17. RECONCILIATION LOGS
-- ============================================
CREATE TABLE public.reconciliation_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_id           UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,
  proxied_cost_usd NUMERIC(12, 6) NOT NULL,
  official_cost_usd NUMERIC(12, 6) NOT NULL,
  gap_usd          NUMERIC(12, 6),
  gap_percent      NUMERIC(5, 2),
  status           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reconciliation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reconciliation logs" ON public.reconciliation_logs
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 18. PLATFORMS (reference data)
-- ============================================
CREATE TABLE public.platforms (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  category              TEXT,
  adapter_pattern       INTEGER,
  auth_type             TEXT,
  base_url              TEXT,
  pricing_url           TEXT,
  key_page_url          TEXT,
  docs_url              TEXT,
  key_type_description  TEXT,
  key_prefix            TEXT,
  avg_monthly_usd_low   NUMERIC,
  avg_monthly_usd_high  NUMERIC,
  special_warning       TEXT,
  color                 TEXT,
  unit_type             TEXT,
  openai_compatible     BOOLEAN DEFAULT false,
  supports_chat         BOOLEAN DEFAULT false,
  supports_embeddings   BOOLEAN DEFAULT false,
  supports_images       BOOLEAN DEFAULT false,
  supports_audio        BOOLEAN DEFAULT false,
  supports_video        BOOLEAN DEFAULT false,
  supports_fine_tuning  BOOLEAN DEFAULT false,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  requires_base_url     BOOLEAN DEFAULT false,
  requires_project_id   BOOLEAN DEFAULT false,
  requires_region       BOOLEAN DEFAULT false,
  has_usage_api         BOOLEAN DEFAULT false,
  sync_delay_minutes    INTEGER,
  proxy_path_prefix     TEXT,
  proxy_supported       BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platforms" ON public.platforms
  FOR SELECT USING (true);

-- ============================================
-- 19. WEBHOOK EVENTS (Dodo idempotency)
-- ============================================
CREATE TABLE public.webhook_events (
  webhook_id   TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_processed_at ON public.webhook_events(processed_at);

-- ============================================
-- 20. CUSTOM COST ENTRIES
-- ============================================
CREATE TABLE public.custom_cost_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id     UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount_usd NUMERIC(12, 2) NOT NULL,
  week_start DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom entries" ON public.custom_cost_entries
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- NEW USER TRIGGER
-- Automatically creates profile + subscription on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1))
  );

  -- Insert company (legacy)
  INSERT INTO public.companies (id, owner_id, name, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Insert subscription (7-day trial)
  INSERT INTO public.subscriptions (id, user_id, status, trial_ends_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'trialing',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED: Price Snapshots (March 2026 prices)
-- ============================================

-- OpenAI
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('openai', 'gpt-4o',        'GPT-4o',        2.500000,  10.000000, true),
  ('openai', 'gpt-4o-mini',   'GPT-4o Mini',   0.150000,   0.600000, true),
  ('openai', 'gpt-4-turbo',   'GPT-4 Turbo',  10.000000,  30.000000, false),
  ('openai', 'gpt-4',         'GPT-4',         30.000000,  60.000000, false),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.500000,   1.500000, false),
  ('openai', 'o1',            'o1',            15.000000,  60.000000, false),
  ('openai', 'o1-mini',       'o1 Mini',        3.000000,  12.000000, false),
  ('openai', 'o3-mini',       'o3 Mini',        1.100000,   4.400000, false);

-- Anthropic
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('anthropic', 'claude-3-5-sonnet', 'Claude 3.5 Sonnet',  3.000000,  15.000000, true),
  ('anthropic', 'claude-3-5-haiku',  'Claude 3.5 Haiku',   0.800000,   4.000000, true),
  ('anthropic', 'claude-3-opus',     'Claude 3 Opus',      15.000000,  75.000000, true),
  ('anthropic', 'claude-3-sonnet',   'Claude 3 Sonnet',     3.000000,  15.000000, false),
  ('anthropic', 'claude-3-haiku',    'Claude 3 Haiku',      0.250000,   1.250000, true);

-- Google Gemini
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 0.100000, 0.400000, false),
  ('gemini', 'gemini-1.5-pro',   'Gemini 1.5 Pro',   1.250000, 5.000000, false),
  ('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 0.075000, 0.300000, false);

-- Mistral
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('mistral', 'mistral-large',  'Mistral Large',  2.000000, 6.000000, false),
  ('mistral', 'mistral-medium', 'Mistral Medium', 2.700000, 8.100000, false),
  ('mistral', 'mistral-small',  'Mistral Small',  1.000000, 3.000000, false),
  ('mistral', 'codestral',      'Codestral',      1.000000, 3.000000, false),
  ('mistral', 'mistral-nemo',   'Mistral Nemo',   0.300000, 0.300000, false);

-- Cohere
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('cohere', 'command-r-plus', 'Command R+',    3.000000, 15.000000, false),
  ('cohere', 'command-r',      'Command R',     0.500000,  1.500000, false),
  ('cohere', 'command-light',  'Command Light', 0.300000,  0.600000, false);

-- AWS Bedrock
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('bedrock', 'anthropic.claude-3-5-sonnet', 'Claude 3.5 Sonnet (Bedrock)', 3.000000,  15.000000, false),
  ('bedrock', 'anthropic.claude-3-haiku',    'Claude 3 Haiku (Bedrock)',    0.250000,   1.250000, false),
  ('bedrock', 'amazon.titan-text-express',   'Titan Text Express',          0.200000,   0.600000, false),
  ('bedrock', 'meta.llama3-70b-instruct',    'Llama 3 70B (Bedrock)',       2.650000,   3.500000, false);

-- Azure OpenAI
INSERT INTO public.price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, supports_caching) VALUES
  ('azure_openai', 'gpt-4o',      'GPT-4o (Azure)',      2.500000, 10.000000, false),
  ('azure_openai', 'gpt-4o-mini', 'GPT-4o Mini (Azure)', 0.150000,  0.600000, false),
  ('azure_openai', 'gpt-4-turbo', 'GPT-4 Turbo (Azure)', 10.000000, 30.000000, false);

-- ============================================
-- SEED: Model Pricing (per-1k format)
-- ============================================

-- OpenAI
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('openai', 'gpt-4o', 'GPT-4o', 0.0025, 0.01, '2026-01-01', true),
  ('openai', 'gpt-4o-mini', 'GPT-4o Mini', 0.00015, 0.0006, '2026-01-01', true),
  ('openai', 'gpt-4-turbo', 'GPT-4 Turbo', 0.01, 0.03, '2026-01-01', true),
  ('openai', 'gpt-4', 'GPT-4', 0.03, 0.06, '2026-01-01', true),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.0005, 0.0015, '2026-01-01', true),
  ('openai', 'o1', 'o1', 0.015, 0.06, '2026-01-01', true),
  ('openai', 'o1-mini', 'o1 Mini', 0.003, 0.012, '2026-01-01', true),
  ('openai', 'o3-mini', 'o3 Mini', 0.0011, 0.0044, '2026-01-01', true);

-- Anthropic
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('anthropic', 'claude-3-5-sonnet', 'Claude 3.5 Sonnet', 0.003, 0.015, '2026-01-01', true),
  ('anthropic', 'claude-3-5-haiku', 'Claude 3.5 Haiku', 0.0008, 0.004, '2026-01-01', true),
  ('anthropic', 'claude-3-opus', 'Claude 3 Opus', 0.015, 0.075, '2026-01-01', true),
  ('anthropic', 'claude-3-sonnet', 'Claude 3 Sonnet', 0.003, 0.015, '2026-01-01', true),
  ('anthropic', 'claude-3-haiku', 'Claude 3 Haiku', 0.00025, 0.00125, '2026-01-01', true);

-- Google Gemini
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 0.0001, 0.0004, '2026-01-01', true),
  ('gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 0.00125, 0.005, '2026-01-01', true),
  ('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 0.000075, 0.0003, '2026-01-01', true);

-- Mistral
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('mistral', 'mistral-large', 'Mistral Large', 0.002, 0.006, '2026-01-01', true),
  ('mistral', 'mistral-medium', 'Mistral Medium', 0.0027, 0.0081, '2026-01-01', true),
  ('mistral', 'mistral-small', 'Mistral Small', 0.001, 0.003, '2026-01-01', true),
  ('mistral', 'codestral', 'Codestral', 0.001, 0.003, '2026-01-01', true),
  ('mistral', 'mistral-nemo', 'Mistral Nemo', 0.0003, 0.0003, '2026-01-01', true);

-- Cohere
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('cohere', 'command-r-plus', 'Command R+', 0.003, 0.015, '2026-01-01', true),
  ('cohere', 'command-r', 'Command R', 0.0005, 0.0015, '2026-01-01', true),
  ('cohere', 'command-light', 'Command Light', 0.0003, 0.0006, '2026-01-01', true);

-- AWS Bedrock
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('bedrock', 'anthropic.claude-3-5-sonnet', 'Claude 3.5 Sonnet (Bedrock)', 0.003, 0.015, '2026-01-01', true),
  ('bedrock', 'anthropic.claude-3-haiku', 'Claude 3 Haiku (Bedrock)', 0.00025, 0.00125, '2026-01-01', true),
  ('bedrock', 'amazon.titan-text-express', 'Titan Text Express', 0.0002, 0.0006, '2026-01-01', true),
  ('bedrock', 'meta.llama3-70b-instruct', 'Llama 3 70B (Bedrock)', 0.00265, 0.0035, '2026-01-01', true);

-- Azure OpenAI
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
  ('azure_openai', 'gpt-4o', 'GPT-4o (Azure)', 0.0025, 0.01, '2026-01-01', true),
  ('azure_openai', 'gpt-4o-mini', 'GPT-4o Mini (Azure)', 0.00015, 0.0006, '2026-01-01', true),
  ('azure_openai', 'gpt-4-turbo', 'GPT-4 Turbo (Azure)', 0.01, 0.03, '2026-01-01', true);

-- ============================================
-- DONE! Your Supabase database is fully set up.
-- ============================================
