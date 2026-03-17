# API Lens — Engineering Reference v1
# Claude Code reads this file automatically at the start of every session.
# Read this completely before writing any code.

---

## Product

API Lens is a $4.99 USD/month SaaS that helps developers, startups, and agencies
track all their AI API spending in one place. Automatic sync every 15 minutes.
No manual entry. No custom platforms. 14 supported providers at launch.

**Two tracking modes:**
- Global tracker `/dashboard` — all keys + all platforms combined
- Project tracker `/projects/[id]` — per-project costs, independent budgets and alerts

**Onboarding advice shown during key addition:**
"For clean per-project tracking, create a separate API key per project
in your provider dashboard. Each key is tracked independently."

---

## The 14 Supported Platforms

| Platform | Auto-sync | Delay | Unit | Pattern |
|---|---|---|---|---|
| OpenAI | Yes | 5 min | Tokens | 2 |
| Anthropic | Yes | Real-time | Tokens | 2 |
| Mistral | Yes | 1 hour | Tokens | 2 |
| Cohere | Yes | Daily | Tokens | 2 |
| OpenRouter | Yes | Daily | Tokens | 1 |
| Google Gemini | Yes | 3 hours | Tokens | 4 |
| Google Vertex AI | Yes | 24-48 hours | Tokens | 4 |
| Azure OpenAI | Yes | 1 hour | Tokens | 4 |
| AWS Bedrock | Yes | Daily | Tokens | 4 |
| ElevenLabs | Yes | Real-time | Characters | 3 |
| Deepgram | Yes | Real-time | Minutes | 3 |
| AssemblyAI | Yes | Real-time | Minutes | 3 |
| Replicate | Yes | Real-time | Compute seconds | 3 |
| Fal AI | Yes | Real-time | Images | 3 |

No manual logging. No custom platforms. These are NOT in v1.

---

## Stack

```
Next.js 15 App Router     TypeScript strict mode
Tailwind CSS v4           shadcn/ui New York zinc
Supabase                  Razorpay
Resend                    Recharts
React Hook Form + Zod     TanStack Table v8
TanStack Query v5         Zustand
Framer Motion             Lucide React
next-themes               Sentry
Fonts: Syne + JetBrains Mono via next/font/google
```

---

## Design tokens

```css
--bg-base:        #09111f;   /* Page background */
--bg-card:        #0c1a2e;   /* Cards, panels */
--bg-sidebar:     #060d18;   /* Sidebar */
--bg-elevated:    #0f2040;   /* Modals, dropdowns */
--border:         #1e3a5f;   /* Standard borders */
--border-subtle:  #152a45;   /* Subtle dividers */
--brand:          #4f46e5;   /* Primary actions */
--brand-hover:    #4338ca;   /* Hover state */
--success:        #10b981;   /* Positive states */
--danger:         #ef4444;   /* Errors, destructive */
--warning:        #f59e0b;   /* Warnings */
--text-primary:   #e2e8f0;   /* Main text */
--text-secondary: #94a3b8;   /* Supporting text */
--text-muted:     #4a6380;   /* Muted / placeholder */
```

Fonts: Syne (UI text) + JetBrains Mono (keys, numbers, code).
All numbers: `tabular-nums` CSS class always.
Default: dark mode. Both modes fully implemented via next-themes.

Chart colours (colourblind-safe, use in this order):
Blue #3b82f6 | Orange #f97316 | Purple #8b5cf6 | Teal #14b8a6 | Yellow #eab308 | Pink #ec4899

---

## Folder structure

```
/app
  /(auth)
    /login/page.tsx
    /signup/page.tsx
    /forgot-password/page.tsx
    /reset-password/page.tsx
    layout.tsx

  /(app)
    layout.tsx
    /onboarding/page.tsx         ← 3 steps: role → project → first key
    /dashboard/page.tsx
    /projects
      page.tsx
      /[id]/page.tsx
    /keys
      page.tsx
      /[id]/page.tsx             ← key detail + sync status + last synced
    /costs/page.tsx
    /estimator/page.tsx
    /budgets/page.tsx
    /alerts/page.tsx
    /reports/page.tsx
    /settings
      /profile/page.tsx
      /security/page.tsx
      /notifications/page.tsx
      /billing/page.tsx
      /team/page.tsx             ← "coming soon" placeholder only

  /(marketing)
    /page.tsx
    /pricing/page.tsx
    /security/page.tsx

  /api
    /webhooks/razorpay/route.ts
    /cron
      /sync-and-check/route.ts   ← every 15 min
      /daily-tasks/route.ts      ← daily 7am UTC
    /platforms
      /route.ts                  ← GET all 14 platforms
      /[id]/route.ts             ← GET single platform
      /detect/route.ts           ← POST {apiKey} → which platform?

/components
  /ui/                           ← shadcn/ui — NEVER edit these directly
  /app
    /layout
      sidebar.tsx                ← shows company_name below logo if set
      topbar.tsx
      app-shell.tsx
      mobile-nav.tsx
      command-palette.tsx
    /onboarding
      role-step.tsx
      project-step.tsx
      key-step.tsx
    /dashboard
      kpi-cards.tsx
      spend-chart.tsx
      platform-breakdown.tsx
      top-keys-table.tsx
      key-health-grid.tsx
      recent-alerts-panel.tsx
      demo-banner.tsx
    /keys
      key-list.tsx
      key-detail.tsx
      add-key-dialog.tsx
      masked-key.tsx
      key-status-badge.tsx
      provider-logo.tsx
      key-intelligence-panel.tsx
      encryption-badge.tsx
      encryption-animation.tsx
    /projects
      project-card.tsx
      create-project-dialog.tsx
      assign-keys-dialog.tsx
      compare-view.tsx
    /costs
      cost-table.tsx
      cost-trend-chart.tsx
      platform-pie-chart.tsx
    /estimator
      estimator-form.tsx
      comparison-table.tsx
      model-swap-suggestion.tsx
      save-estimate-dialog.tsx
    /budgets
      budget-card.tsx
      set-budget-dialog.tsx
    /alerts
      alert-feed.tsx
      alert-item.tsx
      alert-badge.tsx
    /charts
      area-chart.tsx
      bar-chart.tsx
      sparkline.tsx
    /shared
      empty-state.tsx
      error-state.tsx
      loading-skeleton.tsx
      stat-card.tsx
      page-header.tsx
      confirm-dialog.tsx
      last-synced.tsx            ← "Last synced X minutes ago" display

/lib
  env.ts
  /supabase
    client.ts
    server.ts
    admin.ts
  /encryption
    index.ts
  /platforms
    index.ts
    registry.ts
    /adapters
      pattern1-openai-compatible.ts
      pattern2-custom-token.ts
      pattern3-per-unit.ts
      pattern4-cloud-billing.ts
  /razorpay
    client.ts
    helpers.ts
    plans.ts
  /email
    client.ts
    /templates
      welcome.tsx
      alert-budget.tsx
      alert-spike.tsx
      trial-ending.tsx
      trial-expired.tsx
      monthly-report.tsx
      rotation-reminder.tsx
  /validations
    key.ts
    project.ts
    budget.ts
    user.ts
  /utils
    format.ts
    cost.ts
    anomaly.ts
    waste.ts
    budget-check.ts
    price-check.ts
    monthly-report.ts
    cn.ts

/hooks
  use-keys.ts
  use-projects.ts
  use-usage.ts
  use-budgets.ts
  use-alerts.ts
  use-subscription.ts
  use-platforms.ts

/stores
  ui-store.ts
  filter-store.ts

/types
  database.ts
  platform.ts

/styles
  globals.css
```

---

## Database tables

profiles · subscriptions · platforms · projects · api_keys · project_keys ·
usage_records · budgets · alerts · price_snapshots · saved_estimates

Full SQL in SCHEMA.md. RLS on every table. No exceptions.

---

## Cost tracking design rule — non-negotiable

`cost_usd` is ALWAYS calculated and stored at sync time.
All dashboard queries sum `cost_usd`. No conditional logic based on `unit_type`.
`unit_type` and `unit_count` are for display context on the key detail page only.

This means:
- Budgets work identically for OpenAI tokens AND ElevenLabs characters
- Charts work identically for all 14 platforms
- Alert thresholds work identically for all 14 platforms
- Zero branching logic in queries

---

## Cron jobs — exactly 2

```json
{
  "crons": [
    { "path": "/api/cron/sync-and-check", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/daily-tasks",    "schedule": "0 7 * * *" }
  ]
}
```

**sync-and-check (every 15 min):**
- Batch 1: Pattern 2 keys (OpenAI, Anthropic, Mistral, Cohere)
- Batch 2: Pattern 3 keys (ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal)
- Batch 3: Pattern 4 keys (Gemini, Vertex AI, Azure, Bedrock)
- After all batches: run checkBudget() for all users
- Each batch independent — one batch failing does not stop others
- Per-key timeout: 30 seconds. Per-batch timeout: 60 seconds.

**daily-tasks (7am UTC daily):**
- Step 1: OpenRouter credit diff (Pattern 1 — only syncs daily)
- Step 2: price change detection
- Step 3: waste detection (keys unused 30+ days)
- Step 4: rotation reminders (keys 80+ days old)
- Step 5: monthly report — only runs on 1st of month (checked inside route)

---

## Security rules — all absolute, no exceptions

1. AES-256-GCM encryption on every stored API key (exact code in SKILL_03)
2. Never store or log plaintext keys
3. Show only last 4 characters in UI (e.g. sk-...4f8b)
4. Decrypt only immediately before provider API call
5. RLS on every Supabase table — no exceptions ever
6. Razorpay webhook verified with HMAC-SHA256 timingSafeEqual
7. All env vars validated with Zod at startup (in /lib/env.ts)
8. Rate limits: 5 login attempts/15min per IP, 20 key creations/hour/user
9. Never log decrypted key in any error message under any circumstances
10. Email verification enabled in Supabase Auth settings
11. Sentry for error tracking — SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN required

---

## Coding rules

1. TypeScript strict — zero `any` types — treat as compile error
2. Server Components by default — `'use client'` only when required
3. Server Actions for all mutations
4. API routes only for webhooks, cron jobs, and platform metadata endpoints
5. Zod validates 100% of user input before any database write
6. Every async function: typed try/catch, typed return value
7. Every list/table: loading skeleton + empty state + error state
8. `cn()` for all conditional classes
9. Named exports everywhere except page.tsx and layout.tsx
10. File names: kebab-case. Component names: PascalCase.

---

## "Last synced" display rule

Every page or section that shows usage data must display:
"Last synced X minutes ago" (or "just now" if < 1 minute)

This is calculated from `api_keys.last_used` (updated on every successful sync).
Use the `<LastSynced />` component in /components/app/shared/last-synced.tsx.

---

## Keyboard shortcuts

- `⌘K` / `Ctrl+K` — command palette (only keyboard shortcut)
- Do NOT use `⌘N` — conflicts with browser new window
- Do NOT use `⌘P` — conflicts with browser print

---

## Timezone handling

All database aggregations use UTC timestamps.
Display converts to profiles.timezone using the format utilities.
Never hardcode timezone anywhere. Always read from profiles.timezone.

---

## Staging environment

Two Supabase projects:
- Production: connected to vercel production
- Staging: connected to vercel preview deployments

Two separate ENCRYPTION_KEY values — never share keys between environments.

---

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY              (64 hex chars = 32 bytes for AES-256)
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RAZORPAY_PLAN_MONTHLY       (plan_xxx format)
RAZORPAY_PLAN_ANNUAL        (plan_xxx format)
RESEND_API_KEY              (re_ prefix)
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
CRON_SECRET                 (min 32 chars)
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
```

---

## Skill files

```
SKILL_01_ARCHITECTURE.md  — Next.js, TypeScript, Server Actions, conventions
SKILL_02_DATABASE.md      — PostgreSQL, queries, RLS, indexes, optimisation
SKILL_03_SECURITY.md      — AES-256-GCM, auth, env validation, security rules
SKILL_04_FRONTEND.md      — Components, skeletons, TanStack Query, responsive
SKILL_05_PAYMENTS.md      — Razorpay plans, webhook handler, subscription states
SKILL_06_DEVOPS.md        — Vercel config, cron routes, staging, scale
SKILL_07_AI_PLATFORMS.md  — Cost calculation, format utilities, unit types
```

---

## Build order

Session 1:  Scaffold + Auth                         ← COMPLETE
Session 2:  Encryption + Key CRUD + Onboarding
Session 3:  OpenAI Usage Data (Pattern 2 adapter)
Session 4:  Global Dashboard
Session 5:  Project Tracker
Session 6:  Budgets + Alerts
Session 7:  Cost Estimator
Session 8:  All 4 Adapter Patterns fully implemented
Session 9:  Key Detail Page + Auto-Detection polish
Session 10: Razorpay Billing
Session 11: Advanced Alerts + Cron hardening
Session 12: Settings + Reports + Security page
Session 13: Landing Page
Session 14: Polish + Accessibility (WCAG 2.1 AA)
Session 15: Pre-launch + Integration tests
