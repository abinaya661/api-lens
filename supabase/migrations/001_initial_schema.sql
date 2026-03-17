-- ============================================
-- API Lens — Initial Database Schema
-- All 11 core entities from PRD v3 §7
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Companies
-- ============================================
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Users can view own company"
  on public.companies for select
  using (owner_id = auth.uid());

create policy "Users can update own company"
  on public.companies for update
  using (owner_id = auth.uid());

create policy "Users can insert own company"
  on public.companies for insert
  with check (owner_id = auth.uid());

-- ============================================
-- 2. Projects
-- ============================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can insert own projects"
  on public.projects for insert
  with check (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can update own projects"
  on public.projects for update
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can delete own projects"
  on public.projects for delete
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ============================================
-- 3. API Keys
-- ============================================
create type public.provider_type as enum (
  'openai', 'anthropic', 'gemini', 'bedrock',
  'mistral', 'cohere', 'azure_openai', 'custom'
);

create type public.key_health as enum (
  'active', 'invalid', 'sync_error', 'inactive'
);

create table public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  provider public.provider_type not null,
  label text not null,
  encrypted_credentials jsonb not null, -- {ciphertext, iv, tag, dek}
  key_hint text not null, -- last 4 chars
  health public.key_health not null default 'active',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "Users can view own keys"
  on public.api_keys for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can insert own keys"
  on public.api_keys for insert
  with check (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can update own keys"
  on public.api_keys for update
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can delete own keys"
  on public.api_keys for delete
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ============================================
-- 4. Usage Records
-- ============================================
create table public.usage_records (
  id uuid primary key default uuid_generate_v4(),
  key_id uuid not null references public.api_keys(id) on delete cascade,
  provider public.provider_type not null,
  model text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  recorded_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create index idx_usage_key_recorded on public.usage_records(key_id, recorded_at desc);
create index idx_usage_recorded_at on public.usage_records(recorded_at desc);

alter table public.usage_records enable row level security;

create policy "Users can view own usage"
  on public.usage_records for select
  using (key_id in (
    select id from public.api_keys
    where company_id in (select id from public.companies where owner_id = auth.uid())
  ));

create policy "Service role can insert usage"
  on public.usage_records for insert
  with check (true); -- Sync engine uses service role

-- ============================================
-- 5. Budgets
-- ============================================
create type public.budget_scope as enum (
  'global', 'platform', 'project', 'key'
);

create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  scope public.budget_scope not null,
  scope_id text, -- null for global, provider name / project_id / key_id
  amount_usd numeric(12, 2) not null,
  period text not null default 'monthly',
  alert_thresholds integer[] not null default '{50, 75, 90, 100}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, scope, scope_id)
);

alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ============================================
-- 6. Alerts
-- ============================================
create type public.alert_type as enum (
  'budget_threshold', 'spend_spike', 'key_inactive',
  'key_rotation_due', 'custom_cost_reminder'
);

create type public.alert_severity as enum ('info', 'warning', 'critical');

create table public.alerts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.alert_type not null,
  severity public.alert_severity not null default 'info',
  title text not null,
  message text not null,
  related_key_id uuid references public.api_keys(id) on delete set null,
  related_project_id uuid references public.projects(id) on delete set null,
  related_budget_id uuid references public.budgets(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_alerts_company_created on public.alerts(company_id, created_at desc);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"
  on public.alerts for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can update own alerts"
  on public.alerts for update
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Service role can insert alerts"
  on public.alerts for insert
  with check (true);

-- ============================================
-- 7. Notifications
-- ============================================
create type public.notification_channel as enum ('in_app', 'email');

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  channel public.notification_channel not null,
  recipient text not null,
  sent_at timestamptz,
  delivered boolean not null default false,
  error text
);

alter table public.notifications enable row level security;

create policy "Service role manages notifications"
  on public.notifications for all
  using (true);

-- ============================================
-- 8. Cost Estimates
-- ============================================
create table public.cost_estimates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  provider public.provider_type not null,
  model text not null,
  messages_per_day integer not null,
  tokens_per_message integer not null,
  users integer not null default 1,
  estimated_monthly_cost_usd numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.cost_estimates enable row level security;

-- Anyone can insert (estimator is free/no auth)
create policy "Anyone can create estimates"
  on public.cost_estimates for insert
  with check (true);

create policy "Users can view own estimates"
  on public.cost_estimates for select
  using (company_id is null or company_id in (select id from public.companies where owner_id = auth.uid()));

-- ============================================
-- 9. Model Pricing
-- ============================================
create table public.model_pricing (
  id uuid primary key default uuid_generate_v4(),
  provider public.provider_type not null,
  model_id text not null,
  model_name text not null,
  input_price_per_1k numeric(10, 6) not null,
  output_price_per_1k numeric(10, 6) not null,
  effective_date date not null default current_date,
  is_current boolean not null default true
);

create index idx_pricing_provider_model on public.model_pricing(provider, model_id, is_current);

alter table public.model_pricing enable row level security;

-- Pricing is read-only for all authenticated users
create policy "Anyone can read pricing"
  on public.model_pricing for select
  using (true);

-- ============================================
-- 10. Audit Log
-- ============================================
create type public.audit_action as enum (
  'key_created', 'key_updated', 'key_deleted',
  'key_rotated', 'key_assigned', 'key_unassigned',
  'key_validated'
);

create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  action public.audit_action not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb not null default '{}',
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_company_created on public.audit_log(company_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "Users can view own audit logs"
  on public.audit_log for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Service role can insert audit logs"
  on public.audit_log for insert
  with check (true);

-- ============================================
-- 11. Custom Cost Entries
-- ============================================
create table public.custom_cost_entries (
  id uuid primary key default uuid_generate_v4(),
  key_id uuid not null references public.api_keys(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  amount_usd numeric(12, 2) not null,
  week_start date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.custom_cost_entries enable row level security;

create policy "Users can manage own custom entries"
  on public.custom_cost_entries for all
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ============================================
-- 12. Subscriptions
-- ============================================
create type public.subscription_status as enum (
  'trial', 'active', 'grace_period', 'frozen', 'cancelled'
);

create type public.plan_type as enum ('monthly', 'annual');

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  razorpay_subscription_id text,
  status public.subscription_status not null default 'trial',
  plan public.plan_type not null default 'monthly',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (true);

-- ============================================
-- Updated_at trigger function
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.companies
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.api_keys
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.budgets
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();
