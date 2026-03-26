# API Lens — Codebase Map

## 1. Tech Stack
- **Framework:** Next.js 15.2.3, React 19, TypeScript 5.8 (strict), Tailwind CSS 4
- **UI:** shadcn/ui, Radix UI, Recharts 2.15, Framer Motion 12, Lucide React 0.479
- **Auth + DB:** Supabase 2.49 (`@supabase/supabase-js` + `@supabase/ssr`), RLS on all tables
- **Payments:** Dodo Payments 2.23 (MoR) — replaces Razorpay, never use Razorpay
- **Rate Limiting:** Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- **Email:** Resend 4.2, **Analytics:** PostHog, Sentry (`@sentry/nextjs`)
- **State:** TanStack Query 5.71 (server state), Zustand 5 (local state)
- **Validation:** Zod 3.24, **Webhooks:** `standardwebhooks` 1.0
- **Package manager:** `pnpm` only — never npm/yarn
- **Deploy:** Vercel + Vercel Cron. `trigger/` dir exists but is NOT used in production.

---

## 2. Folder Structure
```
app/
  (auth)/          login, signup, verify-email, forgot-password, reset-password
  (dashboard)/     dashboard, keys, keys/[id], projects, budgets, alerts,
                   subscription, settings, settings/billing, settings/notifications,
                   onboarding, estimator, reports
  api/             admin/discounts, admin/passes, cron/sync-and-check, cron/daily-tasks,
                   subscription/create, webhooks/dodo, platforms, platforms/detect,
                   enterprise/notify, health
  page.tsx         Landing page (nav has Blog link)
  blog/            page.tsx (index, glassmorphism cards), [slug]/page.tsx (article + prose styles)
  privacy/         page.tsx
  terms/           page.tsx
  security/        page.tsx
components/
  ui/              shadcn primitives (badge, button, card, dialog, input, etc.)
  dashboard/       metric-cards, cost-chart, provider-breakdown, date-picker
  layout/          header, header-wrapper, sidebar, mobile-nav
  shared/          page-header, empty-state, error-state, stat-card, skeleton-loader, json-ld.tsx
  landing/         animated-counter, dashboard-preview, how-it-works, pricing-section,
                   provider-marquee, regional-price-text, reveal-on-scroll, security-callout
lib/
  actions/         auth, keys, projects, budgets, alerts, dashboard, settings, subscription, promos
  blog.ts          getAllPosts(), getPostBySlug() — gray-matter + remark MDX parser
  dodo/client.ts   Lazy-init Dodo SDK (Proxy pattern)
  encryption/      encryptCredentials, decryptCredentials, extractKeyHint
  platforms/       sync-engine.ts, registry.ts, types.ts, adapters/{provider}.ts
  pricing/         getCurrentPricing, getModelPricing, calculateCost
  ratelimit/       apiRateLimit, authRateLimit, syncRateLimit, checkRateLimit
  structured-data.ts  JSON-LD schema builders (SoftwareApp, WebSite, Org, BlogPosting, BreadcrumbList, FAQ, HowTo, ItemList)
  supabase/        server.ts (SSR), client.ts (browser), admin.ts (service role)
  utils/           audit.ts (logAudit), key-health.ts (getHealthConfig, getVerificationConfig, getTrackabilityConfig)
  validations/     key.ts, project.ts, budget.ts, settings.ts
  env.ts           Zod-validated env schema
  regional-pricing.ts  REGIONAL_PRICES, getRegionalPrice, formatPrice
  utils.ts         cn, formatCurrency, formatNumber, maskKey, timeAgo, getInitials
content/
  blog/            5 MDX posts (gray-matter frontmatter: title, slug, description, date, tags, readTime)
hooks/             use-keys, use-projects, use-budgets, use-alerts, use-dashboard,
                   use-subscription, use-profile, use-regional-price
types/             database.ts, api.ts, providers.ts
supabase/
  migrations/      001_initial_schema, 002_handle_new_user, 003_fix_rls,
                   004_access_passes, 005_dodo_payments, 006_price_snapshots
```

---

## 3. Change Map — Find Files Without Exploring

| What you want to change | Files to edit (in order) |
|---|---|
| **API key: add/change a field** | `supabase/migrations/` → `types/database.ts` (ApiKey) → `lib/validations/key.ts` → `lib/actions/keys.ts` → `hooks/use-keys.ts` → `app/(dashboard)/keys/page.tsx` |
| **API key: add/delete/list logic** | `lib/actions/keys.ts` → `hooks/use-keys.ts` → `app/(dashboard)/keys/page.tsx` |
| **API key: detail page (view/edit/delete)** | `app/(dashboard)/keys/[id]/page.tsx` → `lib/actions/keys.ts` |
| **API key: multiple keys per company** | `supabase/migrations/` → `types/database.ts` → `lib/actions/keys.ts` (listKeys query) → `hooks/use-keys.ts` → `app/(dashboard)/keys/page.tsx` |
| **API key: encryption** | `lib/encryption/index.ts` → `lib/actions/keys.ts` (addKey uses encryptCredentials) → `lib/platforms/sync-engine.ts` (uses decryptCredentials) |
| **API key: validation schema** | `lib/validations/key.ts` (addKeySchema, updateKeySchema) |
| **Add a new API provider** | `lib/platforms/adapters/{provider}.ts` (implement PlatformAdapter) → `lib/platforms/registry.ts` → `types/providers.ts` (PROVIDER_CONFIGS, Provider union) |
| **Provider key detection patterns** | `app/api/platforms/detect/route.ts` |
| **Dashboard metrics** | `lib/actions/dashboard.ts` (getDashboardData) → `types/api.ts` (DashboardData) → `app/(dashboard)/dashboard/page.tsx` → `components/dashboard/` |
| **Subscription / checkout** | `app/api/subscription/create/route.ts` → `lib/actions/subscription.ts` → `app/(dashboard)/subscription/page.tsx` |
| **Subscription webhooks (Dodo events)** | `app/api/webhooks/dodo/route.ts` |
| **Cancel subscription** | `lib/actions/subscription.ts` (cancelSubscription) → `app/(dashboard)/subscription/page.tsx` |
| **Subscription billing UI** | `app/(dashboard)/settings/billing/page.tsx` |
| **Pricing display / regional prices** | `lib/regional-pricing.ts` → `hooks/use-regional-price.ts` → `app/(dashboard)/subscription/page.tsx` + `components/landing/pricing-section.tsx` |
| **Budget add/edit/delete** | `lib/validations/budget.ts` → `lib/actions/budgets.ts` → `hooks/use-budgets.ts` → `app/(dashboard)/budgets/page.tsx` |
| **Budget alert thresholds / checking** | `lib/platforms/sync-engine.ts` (checkBudgets) → `lib/actions/alerts.ts` |
| **Alert display / read state** | `lib/actions/alerts.ts` → `hooks/use-alerts.ts` → `app/(dashboard)/alerts/page.tsx` |
| **Usage sync (cron)** | `lib/platforms/sync-engine.ts` (syncAllKeys) → `app/api/cron/sync-and-check/route.ts` |
| **Daily tasks cron (inactive keys, rotation)** | `app/api/cron/daily-tasks/route.ts` |
| **Auth login/signup/reset** | `lib/actions/auth.ts` → `app/(auth)/{page}/page.tsx` |
| **Protected routes / redirects** | `middleware.ts` |
| **Profile / settings** | `lib/validations/settings.ts` → `lib/actions/settings.ts` → `hooks/use-profile.ts` → `app/(dashboard)/settings/page.tsx` |
| **Access passes / promo codes** | `app/api/admin/passes/route.ts` → `lib/actions/promos.ts` → `app/(dashboard)/settings/billing/page.tsx` |
| **Dodo discount codes (admin)** | `app/api/admin/discounts/route.ts` |
| **Projects CRUD** | `lib/validations/project.ts` → `lib/actions/projects.ts` → `hooks/use-projects.ts` → `app/(dashboard)/projects/page.tsx` |
| **Sidebar nav items** | `components/layout/sidebar.tsx` |
| **Header (alerts badge, user menu)** | `components/layout/header.tsx` + `header-wrapper.tsx` |
| **Add a new admin API endpoint** | `app/api/admin/{name}/route.ts` — auth via `Authorization: Bearer ${CRON_SECRET}` |
| **Pricing data (per-model costs)** | `supabase/migrations/006_price_snapshots.sql` (seed data) → `lib/pricing/index.ts` |
| **Transactional emails** | `lib/email/resend.ts` (templates + sendEmail) → `app/auth/callback/route.ts` (welcome) → `app/api/webhooks/dodo/route.ts` (payment emails) → `app/api/cron/daily-tasks/route.ts` (alerts) |
| **Pro plan waitlist** | `app/api/pro/waitlist/route.ts` → `app/(dashboard)/subscription/page.tsx` (waitlist form) |
| **Env var additions** | `lib/env.ts` (Zod schema) → `.env.example` |
| **Rate limiting** | `lib/ratelimit/index.ts` → `checkRateLimit()` call in the action/route |

---

## 4. Database Schema

**Auth trigger:** On `auth.users` insert → auto-creates `profiles` row + `companies` row + `subscriptions` row (trial, 7 days).

```
companies:       id(uuid PK) name(text) owner_id(uuid→auth.users) created_at updated_at
profiles:        id(uuid PK→auth.users) full_name(text) company_name(text) email(text)
                 onboarded(bool=false) created_at updated_at
projects:        id(uuid PK) company_id(uuid→companies) name(text) description(text)
                 color(text=#4f46e5) is_active(bool=true) created_at updated_at
api_keys:        id(uuid PK) company_id(uuid→companies) project_id(uuid→projects,NULL)
                 provider(provider_type) nickname(text) encrypted_credentials(jsonb)
                 key_hint(text) is_active(bool=true) last_synced_at(timestamptz)
                 consecutive_failures(int=0) last_error(text) endpoint_url(text)
                 notes(text) rotation_due(timestamptz) last_validated(timestamptz)
                 last_failure_reason(text) created_at updated_at
project_keys:    id(uuid PK) project_id(uuid→projects) key_id(uuid→api_keys) created_at
usage_records:   id(uuid PK) key_id(uuid→api_keys) provider(text) model(text)
                 date(date) input_tokens(bigint) output_tokens(bigint) cost_usd(numeric12,6)
                 request_count(int=0) synced_at(timestamptz)
                 UNIQUE(key_id, date, model)
budgets:         id(uuid PK) company_id(uuid→companies) scope(budget_scope)
                 scope_id(text,NULL) platform(text,NULL) amount_usd(numeric12,2)
                 period(text=monthly) alert_50/75/90/100(bool=true) created_at updated_at
                 UNIQUE(company_id, scope, scope_id)
alerts:          id(uuid PK) company_id(uuid→companies) type(alert_type) severity(alert_severity=info)
                 title(text) message(text) related_key_id related_project_id related_budget_id
                 is_read(bool=false) is_emailed(bool=false) created_at
audit_log:       id(uuid PK) company_id user_id action(audit_action) resource_type
                 resource_id metadata(jsonb={}) created_at
subscriptions:   id(uuid PK) company_id(uuid UNIQUE) status(subscription_status=trialing)
                 plan(plan_type=monthly) trial_ends_at current_period_start current_period_end
                 dodo_subscription_id(text UNIQUE) dodo_customer_id(text)
                 period_end last_payment_at grace_period_ends_at created_at updated_at
price_snapshots: id(uuid PK) provider(text) model(text) model_display(text)
                 input_per_mtok(numeric12,6) output_per_mtok(numeric12,6)
                 unit_type(text=tokens) batch_discount(numeric5,4) supports_caching(bool)
                 captured_at UNIQUE(provider, model)
access_passes:   id code(UNIQUE) description pass_type(15_day|30_day) max_uses(int=1)
                 current_uses(int=0) is_active(bool=true) expires_at created_at
access_pass_redemptions: id pass_id(→access_passes) user_id(→auth.users)
                 redeemed_at trial_extended_to UNIQUE(pass_id, user_id)
webhook_events:  id webhook_id(text UNIQUE) event_type processed_at
enterprise_waitlist: id email(UNIQUE) country_code created_at
notifications:   id alert_id channel(in_app|email) recipient sent_at delivered(bool) error
cost_estimates:  id company_id project_id provider model messages_per_day
                 tokens_per_message users estimated_monthly_cost_usd created_at
```

**Enums:**
- `provider_type`: openai | anthropic | gemini | grok | azure_openai | moonshot | deepseek | elevenlabs | openrouter
- `key_health`: active | invalid | sync_error | inactive
- `budget_scope`: global | platform | project | key
- `alert_type`: budget_threshold | spend_spike | key_inactive | key_rotation_due | custom_cost_reminder
- `alert_severity`: info | warning | critical
- `subscription_status`: trialing | active | past_due | cancelled | grace_period | frozen
- `plan_type`: monthly | annual
- `audit_action`: key.created | key.updated | key.deleted (string, not pg enum)

**RLS summary:** All tables scoped to `company_id` owned by `auth.uid()`. Subscriptions/audit_log/notifications are service-role-write-only. `price_snapshots` and `access_passes` are read-only for all authenticated users.

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
  created_at: string; updated_at: string;
}
interface Profile { id: string; full_name: string | null; company_name: string | null;
  email: string; onboarded: boolean; created_at: string; updated_at: string; }
interface Project { id: string; company_id: string; name: string; description: string | null;
  color: string; is_active: boolean; created_at: string; updated_at: string; }
interface Budget { id: string; company_id: string; scope: BudgetScope; scope_id: string | null;
  platform: string | null; amount_usd: number; period: string;
  alert_50: boolean; alert_75: boolean; alert_90: boolean; alert_100: boolean; }
interface Alert { id: string; company_id: string; type: AlertType; severity: AlertSeverity;
  title: string; message: string; related_key_id: string | null;
  related_project_id: string | null; related_budget_id: string | null;
  is_read: boolean; created_at: string; }
interface Subscription { id: string; company_id: string;
  status: 'trialing'|'active'|'past_due'|'cancelled'|'grace_period'|'frozen';
  plan: 'monthly'|'annual'; trial_ends_at: string | null;
  dodo_subscription_id: string | null; dodo_customer_id: string | null;
  period_end: string | null; last_payment_at: string | null; grace_period_ends_at: string | null; }

// types/api.ts
interface DashboardData {
  total_spend_this_month: number; projected_month_end: number;
  budget_remaining: number | null; active_key_count: number;
  daily_spend: { date: string; amount: number }[];
  spend_by_platform: { provider: string; amount: number; percentage: number }[];
  top_keys: { key_id: string; nickname: string; provider: string; amount: number }[];
  recent_alerts: Alert[]; last_synced_at: string | null;
}
interface KeyWithSpend extends ApiKey { current_month_spend: number; last_30_days_spend: number; }
type ActionResult<T> = { data: T; error: null } | { data: null; error: string }
```

---

## 6. Server Actions

All actions return `ActionResult<T>` = `{data, error}` unless noted.

```
lib/actions/auth.ts
  loginWithEmail(email, password) → {success, error}       rate-limited 10/min
  signupWithEmail(companyName, email, password) → {success, error}
  signOut() → void                                          redirects to /login
  resetPassword(email) → {success, error}

lib/actions/keys.ts
  listKeys() → ActionResult<ApiKey[]>                       sorted created_at DESC
  getKey(id) → ActionResult<ApiKey>                         ownership check
  addKey(input: AddKeyInput) → ActionResult<ApiKey>         validates → encrypts → hints → links project → logAudit
  updateKey(input: UpdateKeyInput) → ActionResult<ApiKey>   nickname/project_id/is_active/notes → logAudit
  deleteKey(id) → ActionResult<null>                        cascades project_keys → logAudit

lib/actions/projects.ts
  listProjects() → ActionResult<Project[]>
  getProject(id) → ActionResult<Project>
  createProject(input: CreateProjectInput) → ActionResult<Project>
  updateProject(input: UpdateProjectInput) → ActionResult<Project>
  deleteProject(id) → ActionResult<null>

lib/actions/budgets.ts
  listBudgets() → ActionResult<Budget[]>
  createBudget(input: CreateBudgetInput) → ActionResult<Budget>
  updateBudget(input: UpdateBudgetInput) → ActionResult<Budget>
  deleteBudget(id) → ActionResult<null>

lib/actions/alerts.ts
  listAlerts() → ActionResult<Alert[]>
  getUnreadAlertCount() → ActionResult<number>
  markAlertRead(id) → ActionResult<null>
  markAllAlertsRead() → ActionResult<null>

lib/actions/dashboard.ts
  getDashboardData() → ActionResult<DashboardData>          timezone-aware, month-to-date
  getUsageRecords(dateFrom?, dateTo?, page=1, pageSize=100) → ActionResult<{records, total}>
  getPriceSnapshots() → ActionResult<PriceSnapshot[]>

lib/actions/settings.ts
  getProfile() → ActionResult<Profile>
  updateProfile(input: UpdateProfileInput) → ActionResult<Profile>

lib/actions/subscription.ts
  getSubscription() → ActionResult<Subscription | null>
  cancelSubscription() → ActionResult<null>                 calls Dodo first, then DB

lib/actions/promos.ts
  redeemAccessPass(code) → {success?, trialExtendsTo?, days?, error?}
  getRedemptions() → {data, error}
```

---

## 7. React Hooks

All hooks use TanStack Query. Mutations invalidate listed query keys.

```
useKeys()              → ApiKey[]           query: ['keys']
useAddKey()            → mutation           invalidates: ['keys', 'dashboard']
useUpdateKey()         → mutation           invalidates: ['keys']
useDeleteKey()         → mutation           invalidates: ['keys', 'dashboard']

useProjects()          → Project[]          query: ['projects']
useProject(id)         → Project            query: ['projects', id]
useCreateProject()     → mutation           invalidates: ['projects', 'dashboard']
useUpdateProject()     → mutation           invalidates: ['projects']
useDeleteProject()     → mutation           invalidates: ['projects', 'dashboard']

useBudgets()           → Budget[]           query: ['budgets']
useCreateBudget()      → mutation           invalidates: ['budgets', 'dashboard']
useUpdateBudget()      → mutation           invalidates: ['budgets']
useDeleteBudget()      → mutation           invalidates: ['budgets', 'dashboard']

useAlerts()            → Alert[]            query: ['alerts']
useUnreadAlertCount()  → number             query: ['alerts', 'unread'], refetch every 60s
useMarkAlertRead(id)   → mutation           invalidates: ['alerts']
useMarkAllAlertsRead() → mutation           invalidates: ['alerts']

useDashboard()         → DashboardData      query: ['dashboard'], refetch every 5min
useSubscription()      → Subscription|null  query: ['subscription']
useCancelSubscription()→ mutation           invalidates: ['subscription']
useProfile()           → Profile            query: ['profile']
useUpdateProfile()     → mutation           invalidates: ['profile']
useRegionalPrice()     → RegionalPrice      reads geo_country cookie, memoized
```

---

## 8. API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/subscription/create` | POST | Supabase user | Dodo checkout session → returns checkout_url |
| `/api/webhooks/dodo` | POST | StandardWebhooks sig | Handles: subscription.active/renewed/trialing/canceled/updated, payment.failed/completed |
| `/api/admin/discounts` | GET/POST/DELETE | CRON_SECRET Bearer | List/create/delete Dodo discount codes |
| `/api/admin/passes` | GET/PATCH | CRON_SECRET Bearer | List access passes / toggle is_active |
| `/api/cron/sync-and-check` | GET | CRON_SECRET Bearer | syncAllKeys() + checkBudgets() — runs 00:00 UTC |
| `/api/cron/daily-tasks` | GET | CRON_SECRET Bearer | Detect inactive keys + rotation reminders — runs 07:00 UTC |
| `/api/platforms` | GET | Supabase user | List active platforms |
| `/api/platforms/detect` | POST | validateOrigin (CSRF) | Regex-detect provider from key pattern |
| `/api/enterprise/notify` | POST | None | Enterprise waitlist signup → enterprise_waitlist upsert |
| `/api/pro/waitlist` | POST | None | Pro plan waitlist signup → pro_waitlist DB + Resend audience |
| `/api/health` | GET | None | Checks env vars, Supabase connection, encryption key format |

---

## 9. Patterns & Conventions

**Return types:** Actions return `ActionResult<T>` = `{data: T, error: null}` or `{data: null, error: string}`. Auth actions return `{success, error}`.

**Supabase clients:**
- `lib/supabase/server.ts` → `createClient()` — SSR, use in server components & actions
- `lib/supabase/client.ts` → `createClient()` — browser, use in client components
- `lib/supabase/admin.ts` → `createAdminClient()` — bypasses RLS, use for subscription/audit/promo writes only

**Encryption flow:** `addKey()` calls `encryptCredentials(plainKey)` → stores JSONB. `sync-engine.ts` calls `decryptCredentials(row.encrypted_credentials)` before adapter. Never store plaintext.

**Dodo client:** `import { dodo } from '@/lib/dodo/client'` — lazy Proxy, safe at build time. Call `dodo.subscriptions.update()`, `dodo.checkoutSessions.create()`, etc.

**Webhook handler:** Instantiate `new Webhook(secret)` INSIDE the handler function, not at module scope. Check `webhook_events` table for idempotency (webhook_id UNIQUE).

**Rate limiting:** `checkRateLimit(authRateLimit, identifier)` — falls through silently if Redis not configured. Use `authRateLimit` for auth, `apiRateLimit` for API, `syncRateLimit` for sync routes.

**Validation:** Run Zod schema first (`addKeySchema.safeParse(input)`), then call action. Schemas live in `lib/validations/`.

**Auth in API routes:** Always `const { data: { user } } = await supabase.auth.getUser()`. Never trust client-passed user IDs.

**Admin endpoint auth:** Check `Authorization: Bearer ${process.env.CRON_SECRET}` header.

**Audit logging:** Call `logAudit(supabase, { userId, action: 'key.created', entityType: 'api_key', entityId, metadata })` from `lib/utils/audit.ts` after mutations on api_keys. Non-blocking (fire and forget).

**Key hint:** `extractKeyHint(plainKey)` from `lib/encryption/index.ts` — returns last 4 chars. Display with `maskKey(hint)` from `lib/utils.ts` → `"sk-...{hint}"`.

**Coding style:** 2-space indent, semicolons, single quotes, `@/` import alias, `PascalCase` components/types, `camelCase` functions/vars, `kebab-case` filenames.

**Commands:**
```bash
pnpm dev           # dev server (Turbopack)
pnpm build         # production build
pnpm lint          # ESLint
pnpm type-check    # tsc --noEmit
pnpm test          # Vitest unit (tests/)
pnpm test:e2e      # Playwright e2e (e2e/)
pnpm db:push       # push migrations to Supabase
pnpm db:reset      # reset local schema
```

**Env vars (all declared in `lib/env.ts`):**
```
NEXT_PUBLIC_SUPABASE_URL          NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         ENCRYPTION_KEY (64 hex chars)
CRON_SECRET (≥32 chars)           NEXT_PUBLIC_APP_URL (optional)
DODO_API_KEY                      DODO_WEBHOOK_SECRET
DODO_PRODUCT_MONTHLY_IN           DODO_PRODUCT_ANNUAL_IN
DODO_PRODUCT_MONTHLY_US           DODO_PRODUCT_ANNUAL_US
DODO_PRODUCT_MONTHLY_CA           DODO_PRODUCT_ANNUAL_CA
DODO_PRODUCT_MONTHLY_EU           DODO_PRODUCT_ANNUAL_EU
DODO_PRODUCT_MONTHLY_ROW          DODO_PRODUCT_ANNUAL_ROW
RESEND_API_KEY                    RESEND_FROM_EMAIL (e.g. API Lens <noreply@apilens.tech>)
RESEND_PRO_WAITLIST_ID (opt)      UPSTASH_REDIS_REST_URL (opt)
UPSTASH_REDIS_REST_TOKEN (opt)
```

**Active context (2026-03-26):** Phases 0–6 + email system complete. Base + Pro pricing plans live (Pro is invite-only waitlist). All apilens.dev refs migrated to apilens.tech. Dodo product IDs switched to per-region DODO_PRODUCT_* vars. Email templates (welcome, trial warning, budget alert, rotation reminder, weekly digest) in `lib/email/resend.ts`. Cron jobs: `sync-and-check` (midnight UTC) + `daily-tasks` (7am UTC) in `vercel.json`. Phase 7 = smoke tests. Phase 8 = prod deploy. Latest migration: 006_price_snapshots.

**Sync engine field notes:** `api_keys` uses `encrypted_credentials` (JSONB) and `company_id` (not `user_id`). `usage_records` columns: `key_id, date, provider, model, input_tokens, output_tokens, cost_usd, request_count` — no `user_id`, `total_tokens`, `unit_type`, `unit_count`, or `source` columns. `alerts` uses `company_id` + `related_key_id`/`related_budget_id` (not `user_id`, `scope`, `scope_id`). Budget email lookups go through `companies.owner_id`.
