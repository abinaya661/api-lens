# API Lens - Codebase Map

## 1. Tech Stack
- **Framework:** Next.js 15.2.3, React 19, TypeScript 5.8 (strict), Tailwind CSS 4
- **UI:** shadcn/ui, Radix UI, Recharts 2.15, Framer Motion 12, Lucide React 0.479
- **Auth + DB:** Supabase 2.49 (`@supabase/supabase-js` + `@supabase/ssr`), RLS on all tables
- **Payments:** Dodo Payments 2.23 (MoR) - replaces Razorpay, never use Razorpay
- **Rate Limiting:** Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- **Email:** Resend 4.2, **Analytics:** PostHog, Sentry (`@sentry/nextjs`)
- **State:** TanStack Query 5.71 (server state), Zustand 5 (local state)
- **Validation:** Zod 3.24, **Webhooks:** `standardwebhooks` 1.0
- **Encryption:** AES-256-GCM envelope encryption (per-credential DEK wrapped by master key)
- **Testing:** Vitest 3 (unit), Playwright (e2e)
- **CI/CD:** GitHub Actions -> lint -> type-check -> build -> test -> Vercel auto-deploy on `main`
- **Package manager:** `pnpm` only - never npm/yarn
- **Deploy:** Vercel + Vercel Cron. `trigger/` dir exists but is NOT used in production.

---

## 2. Folder Structure
```
app/
  (auth)/          login, signup, verify-email, forgot-password, reset-password
  (dashboard)/     dashboard, keys, keys/[id], projects, budgets, alerts,
                   subscription, settings, settings/preferences, settings/billing,
                   settings/notifications, onboarding, estimator, reports
  api/             admin/discounts, admin/passes, admin/pricing,
                   cron/sync-and-check, cron/daily-tasks, cron/key-health-check,
                   cron/weekly-report, cron/price-update,
                   subscription/create, webhooks/dodo, platforms, platforms/detect,
                   enterprise/notify, health
components/
  dashboard/       metric-cards, cost-chart, provider-breakdown, date-picker
  estimator/       compare-tab, forecast-tab, forecast-chart, model-card,
                   model-comparison-grid, comparison-input-panel,
                   project-forecast-card, project-selector, use-case-selector
  layout/          header, header-wrapper, sidebar, mobile-nav
  shared/          page-header, empty-state, error-state, stat-card, skeleton-loader
  ui/              shadcn primitives
hooks/             use-keys, use-projects, use-budgets, use-alerts, use-dashboard,
                   use-estimator, use-subscription, use-profile, use-regional-price
lib/
  actions/         _helpers, auth, keys, projects, budgets, alerts, dashboard,
                   estimator, settings, subscription, promos
  forecasting/     index.ts (weighted moving average + forecast series)
  pricing/         getCurrentPricing, getModelPricing, calculateCost,
                   calculateCostWithBatch, calculateCostWithCache
  platforms/       sync-engine.ts, registry.ts, types.ts, adapters/{provider}.ts
  encryption/      encryptCredentials, decryptCredentials, extractKeyHint
  validations/     key.ts, project.ts, budget.ts, settings.ts
  supabase/        server.ts, client.ts, admin.ts
types/             database.ts, api.ts, providers.ts
supabase/
  migrations/      001_initial_schema, 002_handle_new_user, 003_fix_rls,
                   004_access_passes, 005_dodo_payments, 006_price_snapshots,
                   007_webhook_events, 008_notification_prefs,
                   009_estimator_overhaul, 010_live_schema_alignment
tests/             9 Vitest unit test files including forecasting
vercel.json        Cron schedule config (5 jobs)
```

---

## 3. Change Map - Find Files Without Exploring

| What you want to change | Files to edit (in order) |
|---|---|
| **API key fields / CRUD** | `supabase/migrations/` -> `types/database.ts` -> `lib/validations/key.ts` -> `lib/actions/keys.ts` -> `hooks/use-keys.ts` -> `app/(dashboard)/keys/page.tsx` |
| **Projects / budgets / alerts** | `lib/validations/*.ts` -> `lib/actions/*.ts` -> `hooks/use-*.ts` -> `app/(dashboard)/*/page.tsx` |
| **Dashboard metrics** | `lib/actions/dashboard.ts` -> `types/api.ts` -> `app/(dashboard)/dashboard/page.tsx` -> `components/dashboard/` |
| **Estimator compare UI** | `app/(dashboard)/estimator/page.tsx` -> `components/estimator/` -> `hooks/use-estimator.ts` -> `lib/actions/dashboard.ts` (`getPriceSnapshots`) |
| **Estimator forecast logic** | `lib/forecasting/index.ts` -> `lib/actions/estimator.ts` -> `hooks/use-estimator.ts` -> `components/estimator/` |
| **Pricing catalog / maintenance** | `supabase/migrations/009_estimator_overhaul.sql` -> `lib/pricing/index.ts` -> `app/api/admin/pricing/route.ts` -> `app/api/cron/price-update/route.ts` |
| **Subscription checkout / billing UI** | `app/api/subscription/create/route.ts` -> `app/api/webhooks/dodo/route.ts` -> `lib/actions/subscription.ts` -> `app/(dashboard)/subscription/page.tsx` |
| **Access passes / promos** | `app/api/admin/passes/route.ts` -> `lib/actions/promos.ts` -> `app/(dashboard)/settings/billing/page.tsx` |
| **Notifications / preferences** | `lib/actions/settings.ts` -> `hooks/use-profile.ts` -> `app/(dashboard)/settings/preferences/page.tsx` / `settings/notifications/page.tsx` |
| **Sync / cron automation** | `lib/platforms/sync-engine.ts` -> `app/api/cron/*/route.ts` -> `vercel.json` |
| **Add a provider** | `lib/platforms/adapters/{provider}.ts` -> `lib/platforms/registry.ts` -> `types/providers.ts` |
| **Add an admin endpoint** | `app/api/admin/{name}/route.ts` with `Authorization: Bearer ${CRON_SECRET}` |
| **Env var additions** | `lib/env.ts` -> `.env.example` |

---

## 4. Database Schema

**Auth trigger:** On `auth.users` insert -> auto-creates `profiles`, `companies`, and `subscriptions` (`trialing`, 7 days).

```
companies:       id(uuid PK) name(text) owner_id(uuid->auth.users) created_at updated_at
profiles:        id(uuid PK->auth.users) full_name company_name email
                 onboarded(bool=false) timezone(text=UTC) currency(text=USD)
                 notification_prefs(jsonb={}) created_at updated_at
projects:        id(uuid PK) company_id(uuid->companies) name description
                 color is_active created_at updated_at
api_keys:        id(uuid PK) company_id(uuid->companies) project_id(uuid->projects,NULL)
                 provider nickname encrypted_credentials(jsonb) key_hint
                 is_active last_synced_at consecutive_failures last_error
                 endpoint_url notes rotation_due last_validated last_failure_reason
                 created_at updated_at
usage_records:   id(uuid PK) key_id(uuid->api_keys) provider model date
                 input_tokens output_tokens cost_usd request_count synced_at
                 UNIQUE(key_id, date, model)
budgets:         id(uuid PK) company_id(uuid->companies) scope scope_id platform
                 amount_usd period alert_50/75/90/100 created_at updated_at
alerts:          id(uuid PK) company_id(uuid->companies) type severity
                 title message related_key_id related_project_id related_budget_id
                 is_read is_emailed created_at
subscriptions:   id(uuid PK) company_id(uuid UNIQUE) status(subscription_status=trialing)
                 plan trial_ends_at current_period_start current_period_end
                 dodo_subscription_id dodo_customer_id payment_method_collected
                 period_end last_payment_at grace_period_ends_at created_at updated_at
price_snapshots: id(uuid PK) provider model model_display category
                 input_per_mtok output_per_mtok unit_type unit_display
                 batch_discount supports_caching capability_score is_deprecated
                 context_window supports_batch batch_input_per_mtok
                 batch_output_per_mtok cached_input_per_mtok image_prices
                 per_unit_price captured_at UNIQUE(provider, model)
webhook_events:  webhook_id(text UNIQUE) event_type processed_at
notifications:   id alert_id channel recipient sent_at delivered error
cost_estimates:  id company_id project_id provider model messages_per_day
                 tokens_per_message users estimated_monthly_cost_usd created_at
```

**Enums:**
- `provider_type`: openai | anthropic | gemini | grok | azure_openai | moonshot | deepseek | elevenlabs | openrouter
- `budget_scope`: global | platform | project | key
- `alert_type`: budget_threshold | spend_spike | key_inactive | key_rotation_due | custom_cost_reminder
- `alert_severity`: info | warning | critical
- `subscription_status`: trialing | active | past_due | cancelled | grace_period | frozen
- `plan_type`: monthly | annual

**Ownership model:** Company-owned workspace data with exactly one user per company today. There is no team/member model yet; `companies.owner_id` is the single runtime owner used for auth, billing, alerts, and forecasting.

**RLS summary:** All user-visible data is scoped to the company owned by `auth.uid()`. `price_snapshots` and `access_passes` are read-only for authenticated users. Subscriptions, audit log, notifications, and pricing maintenance rely on service-role writes.

---

## 5. Key TypeScript Types

```ts
// types/database.ts
interface ApiKey {
  id: string; company_id: string; project_id: string | null;
  provider: Provider; nickname: string;
  encrypted_credentials: { ciphertext: string; iv: string; tag: string; dek: string };
  key_hint: string; is_active: boolean; last_synced_at: string | null;
  consecutive_failures: number; last_error: string | null;
  endpoint_url: string | null; notes: string | null;
  rotation_due: string | null; last_failure_reason: string | null;
}
interface PriceSnapshot {
  provider: string; model: string; model_display: string | null;
  category: string; input_per_mtok: number; output_per_mtok: number;
  unit_type: string; unit_display: string; supports_caching: boolean;
  capability_score: number; is_deprecated: boolean;
  supports_batch: boolean; batch_input_per_mtok: number | null;
  batch_output_per_mtok: number | null; cached_input_per_mtok: number | null;
  image_prices: unknown[] | null; per_unit_price: number | null;
}

// types/api.ts
interface DashboardData {
  total_spend_this_month: number; projected_month_end: number;
  budget_remaining_usd: number | null; budget_remaining_pct: number | null;
  active_key_count: number; daily_spend: { date: string; amount: number }[];
  spend_by_platform: { provider: string; amount: number; percentage: number }[];
  top_keys: { id: string; nickname: string; provider: string; key_hint: string; current_month_spend: number }[];
  recent_alerts: Alert[]; last_synced_at: string | null;
}
interface CompanyForecast {
  current_spend: number; forecast_month_end: number;
  confidence_low: number; confidence_high: number;
  daily_data: ForecastDataPoint[]; by_project: ProjectForecast[];
  unassigned_spend: number; by_provider: PlatformSpend[];
  budget_amount: number | null; budget_utilization_pct: number | null;
}
type ActionResult<T> = { data: T; error: null } | { data: null; error: string }
```

---

## 6. Server Actions

All actions return `ActionResult<T>` = `{data, error}` unless noted.

```
lib/actions/auth.ts
  loginWithEmail(email, password) -> {success, error}
  signupWithEmail(companyName, email, password) -> {success, error}
  signOut() -> void
  resetPassword(email) -> {success, error}

lib/actions/keys.ts
  listKeys(), getKey(id), addKey(input), updateKey(input), deleteKey(id)

lib/actions/projects.ts
  listProjects(), getProject(id), createProject(input), updateProject(input), deleteProject(id)

lib/actions/budgets.ts
  listBudgets(), createBudget(input), updateBudget(input), deleteBudget(id)

lib/actions/alerts.ts
  listAlerts(), getUnreadAlertCount(), markAlertRead(id), markAllAlertsRead()

lib/actions/dashboard.ts
  getDashboardData()
  getUsageRecords(dateFrom?, dateTo?, page=1, pageSize=100)
  getPriceSnapshots(category?, includeDeprecated?)

lib/actions/estimator.ts
  getCompanyForecast()
  getProjectForecast(projectId)

lib/actions/settings.ts
  getProfile(), updateProfile(input)
  getNotificationPrefs(), updateNotificationPrefs(prefs)

lib/actions/subscription.ts
  getSubscription()        # company-scoped
  cancelSubscription()

lib/actions/promos.ts
  redeemAccessPass(code)
  getRedemptions()
```

---

## 7. React Hooks

All hooks use TanStack Query. Mutations invalidate listed query keys.

```
useKeys()                -> ['keys']
useProjects()            -> ['projects']
useBudgets()             -> ['budgets']
useAlerts()              -> ['alerts']
useDashboard()           -> ['dashboard']
useCompanyForecast()     -> ['estimator', 'company-forecast']
useProjectForecast(id)   -> ['estimator', 'project-forecast', id]
usePriceSnapshots(cat?)  -> ['price-snapshots', category ?? 'all', includeDeprecated]
useSubscription()        -> ['subscription']
useProfile()             -> ['profile']
useRegionalPrice()       -> geo_country cookie
```

---

## 8. API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/subscription/create` | POST | Supabase user | Dodo checkout session -> returns `checkout_url` |
| `/api/webhooks/dodo` | POST | StandardWebhooks sig | Handles subscription/payment events |
| `/api/admin/discounts` | GET/POST/DELETE | CRON_SECRET Bearer | Manage Dodo discount codes |
| `/api/admin/passes` | GET/PATCH | CRON_SECRET Bearer | Manage access passes |
| `/api/admin/pricing` | GET/POST/PUT | CRON_SECRET Bearer | Read/upsert estimator pricing catalog |
| `/api/cron/sync-and-check` | GET | CRON_SECRET Bearer | Sync usage + check budgets |
| `/api/cron/daily-tasks` | GET | CRON_SECRET Bearer | Inactive key detection + rotation reminders |
| `/api/cron/key-health-check` | GET | CRON_SECRET Bearer | Key health email workflow |
| `/api/cron/weekly-report` | GET | CRON_SECRET Bearer | Weekly digest email |
| `/api/cron/price-update` | GET | CRON_SECRET Bearer | Best-effort provider pricing refresh + summary email |
| `/api/platforms` | GET | Supabase user | List active platforms |
| `/api/platforms/detect` | POST | `validateOrigin` (CSRF) | Detect provider from key pattern |
| `/api/enterprise/notify` | POST | None | Enterprise waitlist signup |
| `/api/pro/waitlist` | POST | None | Pro waitlist signup |
| `/api/health` | GET | None | Health/env check |

---

## 9. Patterns & Conventions

**Return types:** Actions return `ActionResult<T>`; auth actions return `{success, error}`.

**Supabase clients:**
- `lib/supabase/server.ts` -> SSR/server actions
- `lib/supabase/client.ts` -> browser
- `lib/supabase/admin.ts` -> service-role operations

**Encryption flow:** `addKey()` encrypts plaintext into `encrypted_credentials`; sync paths decrypt from JSONB just-in-time.

**Webhook pattern:** Instantiate `new Webhook(secret)` inside the handler. Use `webhook_events` for idempotency. Checkout metadata should include both `user_id` and `company_id`, and webhook resolution should prefer `company_id` with `user_id` as a compatibility fallback.

**Pricing source of truth:** `price_snapshots` powers the estimator and pricing helpers. Seed baseline data in migration `009_estimator_overhaul`; use `/api/admin/pricing` for manual updates and `/api/cron/price-update` for best-effort refreshes.

**Auth in API routes:** Always call `supabase.auth.getUser()` server-side. Never trust client-supplied user IDs.

**Admin endpoint auth:** `Authorization: Bearer ${process.env.CRON_SECRET}`.

**Audit logging:** Use `logAudit(...)` after API key mutations.

**Commands:**
```bash
pnpm dev
pnpm build
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm db:push
pnpm db:reset
```

**Env vars (all declared in `lib/env.ts`):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
ENCRYPTION_KEY
CRON_SECRET
DODO_API_KEY
DODO_WEBHOOK_SECRET
DODO_PRODUCT_{MONTHLY|ANNUAL}_{IN|US|CA|EU|ROW}
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_PRO_WAITLIST_ID
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## 10. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Auth** | Supabase Auth (JWT tokens, refresh via middleware) |
| **Data Isolation** | RLS on all runtime tables, scoped to the single company owned by `auth.uid()` |
| **API Key Storage** | AES-256-GCM envelope encryption |
| **Input Validation** | Zod schemas + private IP blocking on endpoint URLs |
| **CSRF** | Origin header validation on mutation endpoints |
| **Rate Limiting** | Upstash Redis sliding window with in-memory fallback |
| **Redirect Safety** | `getSafeRedirect()` blocks open redirects |
| **HTTP Headers** | HSTS, X-Frame-Options, CSP, Referrer-Policy |
| **Webhook Verification** | Standard Webhooks signature + timestamp validation |
| **Idempotency** | `webhook_events` prevents duplicate webhook processing |

---

**Active context (2026-03-28):**
- **Final Polish (Mar 26):** Blog UI redesigned, email templates modernized, dark/light theme toggle added, SEO optimized for "api key manager".
- **Email & UI updates (Mar 27-28):** Welcome email simplified, pro waitlist confirmation email added, sidebar restructured, preferences split to `settings/preferences`.
- **Estimator & pricing intelligence (Mar 28):** Estimator replaced with compare + forecast tabs, forecasting module added, `price_snapshots` expanded via migration `009`, pricing admin API and bi-weekly `price-update` cron added, subscriptions/webhooks aligned to `company_id`, live schema alignment captured in migration `010`.
- **Ownership model (Mar 30):** Company-owned workspace model is the canonical runtime path for keys, projects, budgets, alerts, subscriptions, and forecasts. We still operate as one user per company for now, and legacy `user_id` columns remain compatibility fields only for live-schema migration safety.
- **Status:** Code verified with `type-check`, `test`, and `build`. Live Supabase project must have migrations `009` and `010` applied before production deploy (`008` too if missing).

**Cron jobs (5 total in `vercel.json`):**
- `sync-and-check` - every 6h
- `daily-tasks` - 07:00 UTC daily
- `key-health-check` - 06:00 UTC daily
- `weekly-report` - Mon 08:00 UTC
- `price-update` - 1st and 15th 09:00 UTC

**DB migrations in repo:** `001-010`. Latest: `010_live_schema_alignment`.
