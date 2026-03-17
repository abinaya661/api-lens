# Skill 02 — Database Design & Query Optimisation
# Expert: DBE — Database Expert
# Read this for: index strategy, RLS, the 5 core queries, upsert pattern

I have designed schemas for systems handling hundreds of millions of rows.
The same mistakes appear every time: missing indexes, incorrect RLS, N+1 queries,
and queries written for 100 rows that collapse at 1 million.
API Lens will grow. Design it now as if you already have 100,000 users.

---

## Why PostgreSQL and Supabase

Our data is deeply relational: users → keys → usage records → projects.
Document databases (MongoDB, Firebase) require multiple round-trips for this
shape. PostgreSQL handles it in a single JOIN query.

Firebase Firestore charges per read — catastrophic for dashboards that
read thousands of records per load. PostgreSQL is free to query.

Supabase gives us: PostgreSQL, Row Level Security, real-time subscriptions,
a generous free tier, and a clean JavaScript API.

---

## Index Strategy — every index has a reason

```sql
-- usage_records will have millions of rows.
-- Every dashboard query filters by user_id and date.
-- Without this index: full table scan on every page load.
-- With this index: queries for a user's monthly data take <5ms at scale.
CREATE INDEX idx_usage_user_date  ON usage_records(user_id, date DESC);

-- Platform breakdown chart queries provider within a user's rows.
CREATE INDEX idx_usage_user_prov  ON usage_records(user_id, provider, date DESC);

-- Key detail pages and top keys table use key_id.
CREATE INDEX idx_usage_key_date   ON usage_records(key_id, date DESC);

-- api_keys is filtered by is_active in almost every query.
CREATE INDEX idx_api_keys_user    ON api_keys(user_id, is_active);

-- Alerts badge count queries unread alerts newest-first.
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read, created_at DESC);
```

---

## Row Level Security — the correct mental model

RLS is not a feature. It is a safety net.
Even if application code has a bug and queries another user's data,
RLS at the database level prevents it. This is defence in depth.

```sql
-- The pattern for every table:
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- auth.uid() is evaluated per-row, per-query, at the database level.
-- No application code can bypass this.
CREATE POLICY "projects: users own their rows"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- For junction tables: verify ownership through a subquery.
CREATE POLICY "project_keys: via project ownership"
  ON project_keys FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );
-- This subquery uses the projects index — it is fast.
```

---

## The 5 Core Dashboard Queries

### QUERY 1: Global KPIs for current month

```sql
-- date_trunc('month', current_date) is better than a hardcoded date string.
-- It works correctly regardless of timezone and requires no application code.
SELECT
  COALESCE(SUM(cost_usd),      0)::NUMERIC(12,4) AS total_spend_mtd,
  COALESCE(SUM(total_tokens),  0)                AS total_tokens_mtd,
  COUNT(DISTINCT key_id)                          AS active_keys_count,
  COALESCE(SUM(request_count), 0)                AS total_requests_mtd
FROM usage_records
WHERE
  user_id = auth.uid()
  AND date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date <= CURRENT_DATE;
```

### QUERY 2: Daily spend last 30 days WITH gap-filling

```sql
-- Without gap-filling: days with no spend return no row.
-- The chart shows missing data points — looks broken.
-- generate_series fills every day regardless of spend.
WITH days AS (
  SELECT GENERATE_SERIES(
    CURRENT_DATE - 29, CURRENT_DATE, INTERVAL '1 day'
  )::DATE AS day
)
SELECT
  d.day,
  COALESCE(SUM(ur.cost_usd), 0)::NUMERIC(12,4) AS cost_usd
FROM days d
LEFT JOIN usage_records ur
  ON  ur.date    = d.day
  AND ur.user_id = auth.uid()
GROUP BY d.day
ORDER BY d.day ASC;
```

### QUERY 3: Spend by platform this month

```sql
SELECT
  provider,
  SUM(cost_usd)::NUMERIC(12,4) AS cost_usd,
  SUM(total_tokens)             AS total_tokens,
  COUNT(DISTINCT key_id)        AS key_count
FROM usage_records
WHERE
  user_id = auth.uid()
  AND date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY provider
ORDER BY cost_usd DESC;
```

### QUERY 4: Per-project spend this month

```sql
-- Table join order: projects (small) → project_keys (medium) → usage_records (large)
SELECT
  p.id, p.name, p.color,
  COALESCE(SUM(ur.cost_usd), 0)::NUMERIC(12,4) AS cost_usd,
  COUNT(DISTINCT pk.key_id)                      AS key_count
FROM projects p
LEFT JOIN project_keys  pk ON pk.project_id = p.id
LEFT JOIN usage_records ur
  ON  ur.key_id  = pk.key_id
  AND ur.user_id = auth.uid()
  AND ur.date   >= DATE_TRUNC('month', CURRENT_DATE)
WHERE p.user_id = auth.uid() AND p.is_active = TRUE
GROUP BY p.id, p.name, p.color
ORDER BY cost_usd DESC;
```

### QUERY 5: Anomaly detection — spike > 3x 7-day rolling average

```sql
-- Conditional aggregation (CASE WHEN) does this in ONE query.
-- Two separate queries would require two database round-trips.
SELECT
  key_id,
  SUM(CASE WHEN date = CURRENT_DATE THEN cost_usd ELSE 0 END) AS today_cost,
  AVG(CASE WHEN date < CURRENT_DATE  THEN cost_usd END)       AS avg_7d,
  ROUND(
    SUM(CASE WHEN date = CURRENT_DATE THEN cost_usd ELSE 0 END)
    / NULLIF(AVG(CASE WHEN date < CURRENT_DATE THEN cost_usd END), 0),
    1
  ) AS spike_multiple
FROM usage_records
WHERE
  user_id = auth.uid()
  AND date >= CURRENT_DATE - 7
GROUP BY key_id
HAVING
  SUM(CASE WHEN date = CURRENT_DATE THEN cost_usd ELSE 0 END)
  > AVG(CASE WHEN date < CURRENT_DATE THEN cost_usd END) * 3
  AND SUM(CASE WHEN date = CURRENT_DATE THEN cost_usd ELSE 0 END) > 0.01;
-- 0.01 threshold prevents false positives from trivially small amounts.
```

---

## The Upsert Pattern for Usage Records

```typescript
// Use upsert, not insert.
// Cron jobs run multiple times (network retries, function restarts).
// Upsert with onConflict is idempotent — safe to call with the same data
// multiple times without creating duplicate rows.

await supabase.from('usage_records').upsert(
  records.map(r => ({
    key_id:        keyId,
    user_id:       userId,
    date:          r.date,
    provider:      r.provider,
    model:         r.model,
    input_tokens:  r.inputTokens,
    output_tokens: r.outputTokens,
    total_tokens:  r.totalTokens,
    unit_type:     r.unitType,
    unit_count:    r.unitCount,
    cost_usd:      r.costUsd,
    request_count: r.requestCount,
  })),
  { onConflict: 'key_id,date,model' }
)
```

---

## Never Use select('*') on api_keys

```typescript
// WRONG — loads encrypted_key into memory unnecessarily:
const { data } = await supabase.from('api_keys').select('*')

// CORRECT — encrypted_key only when you actually need to decrypt:
const { data } = await supabase
  .from('api_keys')
  .select('id, provider, nickname, key_hint, is_active, is_valid, last_used, rotation_due, created_at')
```

The encrypted_key column should only appear in a select when you are
about to decrypt it for a sync operation. Never in list queries or dashboards.

---

## Data Retention

usage_records older than 12 months are archived (not deleted) to cold storage.
A monthly archive job (part of daily-tasks on 1st of month) moves old records.
Archived records are not included in standard dashboard queries.
Users can request access to archived data (manual process in v1).
