-- Audit log for tracking key mutations
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Users can view own audit logs"
  on public.audit_log for select using (auth.uid() = user_id);

create index idx_audit_log_user_id on public.audit_log(user_id);
create index idx_audit_log_created_at on public.audit_log(created_at);
