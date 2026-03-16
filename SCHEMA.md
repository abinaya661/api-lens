-- ============================================================
-- API Lens — Database Schema
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES — one row per user
-- ============================================================
create table profiles (
  id           uuid references auth.users on delete cascade primary key,
  full_name    text,
  avatar_url   text,
  timezone     text not null default 'UTC',
  currency     text not null default 'USD',
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles: own row" on profiles for all using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- SUBSCRIPTIONS — payment and trial status
-- ============================================================
create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  razorpay_customer_id     text,
  razorpay_subscription_id text unique,
  plan                     text not null default 'trial'
                           check (plan in ('trial','pro','annual','cancelled','expired','paused')),
  billing_cycle            text check (billing_cycle in ('monthly','annual')),
  trial_ends_at            timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);

alter table subscriptions enable row level security;
create policy "subscriptions: own row" on subscriptions for select using (auth.uid() = user_id);

-- ============================================================
-- PROJECTS — named cost buckets
-- ============================================================
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  color       text not null default '#4f46e5',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table projects enable row level security;
create policy "projects: own rows" on projects for all using (auth.uid() = user_id);
create index idx_projects_user on projects(user_id, is_active);

-- ============================================================
-- API KEYS — encrypted key storage
-- ============================================================
create table api_keys (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  provider        text not null
                  check (provider in ('openai','anthropic','gemini','aws','azure','mistral','cohere','custom')),
  nickname        text not null check (char_length(nickname) between 1 and 100),
  encrypted_key   text not null,
  key_hint        text not null check (char_length(key_hint) = 4),
  is_active       boolean not null default true,
  is_valid        boolean not null default true,
  last_validated  timestamptz,
  last_used       timestamptz,
  rotation_due    timestamptz,
  notes           text,
  endpoint_url    text,
  custom_cost_per_request    numeric(10,8),
  custom_cost_per_1k_tokens  numeric(10,8),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table api_keys enable row level security;
create policy "api_keys: own rows" on api_keys for all using (auth.uid() = user_id);
create index idx_api_keys_user on api_keys(user_id, is_active);
create index idx_api_keys_provider on api_keys(user_id, provider);

-- ============================================================
-- PROJECT KEYS — links keys to projects (many to many)
-- ============================================================
create table project_keys (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  key_id      uuid not null references api_keys(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (project_id, key_id)
);

alter table project_keys enable row level security;
create policy "project_keys: own rows" on project_keys for all using (
  auth.uid() = (select user_id from projects where id = project_id)
);

-- ============================================================
-- USAGE RECORDS — daily spend data per key per model
-- ============================================================
create table usage_records (
  id              uuid primary key default gen_random_uuid(),
  key_id          uuid not null references api_keys(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  date            date not null,
  provider        text not null,
  model           text not null default 'unknown',
  input_tokens    bigint not null default 0,
  output_tokens   bigint not null default 0,
  total_tokens    bigint not null default 0,
  cost_usd        numeric(12,8) not null default 0,
  request_count   integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (key_id, date, model)
);

alter table usage_records enable row level security;
create policy "usage_records: own rows" on usage_records for all using (auth.uid() = user_id);
create index idx_usage_user_date   on usage_records(user_id, date desc);
create index idx_usage_key_date    on usage_records(key_id, date desc);
create index idx_usage_user_prov   on usage_records(user_id, provider, date desc);

-- ============================================================
-- BUDGETS — limits at every level
-- ============================================================
create table budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  scope       text not null check (scope in ('global','platform','project','key')),
  scope_id    uuid,
  platform    text,
  amount_usd  numeric(10,2) not null check (amount_usd > 0),
  period      text not null default 'monthly',
  alert_50    boolean not null default true,
  alert_75    boolean not null default true,
  alert_90    boolean not null default true,
  alert_100   boolean not null default true,
  last_alerted_threshold integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table budgets enable row level security;
create policy "budgets: own rows" on budgets for all using (auth.uid() = user_id);

-- ============================================================
-- ALERTS — notification history
-- ============================================================
create table alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in (
    'budget_50','budget_75','budget_90','budget_100',
    'spike','waste','rotation','price_change','outage'
  )),
  scope       text check (scope in ('global','project','key','platform')),
  scope_id    uuid,
  scope_name  text,
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  is_emailed  boolean not null default false,
  severity    text not null default 'info' check (severity in ('info','warning','danger')),
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table alerts enable row level security;
create policy "alerts: own rows" on alerts for all using (auth.uid() = user_id);
create index idx_alerts_user_unread on alerts(user_id, is_read, created_at desc);

-- ============================================================
-- PRICE SNAPSHOTS — current pricing data for all platforms
-- ============================================================
create table price_snapshots (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null,
  model             text not null,
  model_display     text,
  input_per_mtok    numeric(10,4) not null,
  output_per_mtok   numeric(10,4) not null,
  batch_discount    numeric(4,2),
  supports_caching  boolean default false,
  captured_at       timestamptz not null default now()
);

-- Seed all platform pricing
insert into price_snapshots (provider, model, model_display, input_per_mtok, output_per_mtok, batch_discount, supports_caching) values
  ('openai','gpt-4o','GPT-4o',2.50,10.00,0.50,true),
  ('openai','gpt-4o-mini','GPT-4o Mini',0.15,0.60,0.50,false),
  ('openai','o3','o3',2.00,8.00,0.50,false),
  ('openai','o4-mini','o4-mini',1.10,4.40,0.50,false),
  ('anthropic','claude-opus-4-6','Claude Opus 4.6',5.00,25.00,0.50,true),
  ('anthropic','claude-sonnet-4-6','Claude Sonnet 4.6',3.00,15.00,0.50,true),
  ('anthropic','claude-haiku-4-5','Claude Haiku 4.5',1.00,5.00,0.50,true),
  ('anthropic','claude-haiku-3','Claude Haiku 3',0.25,1.25,0.50,true),
  ('gemini','gemini-2.5-pro','Gemini 2.5 Pro',1.25,10.00,0.50,true),
  ('gemini','gemini-2.5-flash','Gemini 2.5 Flash',0.30,2.50,0.50,false),
  ('gemini','gemini-2.5-flash-lite','Gemini 2.5 Flash-Lite',0.10,0.40,0.50,false),
  ('aws','meta.llama4-maverick','Llama 4 Maverick',0.18,0.90,null,false),
  ('aws','amazon.titan-text-express','Titan Text Express',0.20,0.60,null,false),
  ('azure','gpt-4o','GPT-4o (Azure)',2.50,10.00,null,false),
  ('azure','gpt-4o-mini','GPT-4o Mini (Azure)',0.15,0.60,null,false),
  ('mistral','mistral-large-latest','Mistral Large',2.00,6.00,null,false),
  ('mistral','mistral-medium','Mistral Medium',0.40,1.20,null,false),
  ('mistral','mistral-small','Mistral Small',0.10,0.30,null,false),
  ('mistral','codestral-latest','Codestral',0.30,0.90,null,false),
  ('cohere','command-r-plus','Command R+',2.50,10.00,null,false),
  ('cohere','command-r','Command R',0.15,0.60,null,false),
  ('cohere','embed-english-v3','Embed English v3',0.10,0.00,null,false);

-- ============================================================
-- SAVED ESTIMATES — from cost estimator
-- ============================================================
create table saved_estimates (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  project_id            uuid references projects(id) on delete set null,
  name                  text not null,
  provider              text not null,
  model                 text not null,
  messages_per_day      integer not null,
  avg_input_tokens      integer not null,
  avg_output_tokens     integer not null,
  num_users             integer not null default 1,
  use_batch             boolean not null default false,
  projected_monthly_usd numeric(10,2),
  actual_monthly_usd    numeric(10,2),
  created_at            timestamptz not null default now()
);

alter table saved_estimates enable row level security;
create policy "saved_estimates: own rows" on saved_estimates for all using (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at before update on profiles for each row execute procedure update_updated_at();
create trigger trg_projects_updated_at before update on projects for each row execute procedure update_updated_at();
create trigger trg_api_keys_updated_at before update on api_keys for each row execute procedure update_updated_at();
create trigger trg_budgets_updated_at before update on budgets for each row execute procedure update_updated_at();
create trigger trg_subscriptions_updated_at before update on subscriptions for each row execute procedure update_updated_at();
