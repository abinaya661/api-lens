-- Prevent duplicate budget threshold alerts from race conditions
create unique index if not exists idx_alerts_budget_threshold
  on public.alerts (user_id, type, scope, scope_id, title)
  where type = 'budget_threshold';
