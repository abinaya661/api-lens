# API Lens — Engineering Reference
# Claude Code reads this file at the start of every session.
# Read it completely before writing any code.

---

## Product

API Lens is a $4.99 USD/month SaaS that helps anyone using multiple AI API keys manage them, track real spending, set budgets, and prevent surprise bills. Web-first. No mobile in v1.

**Two core tracking modes:**
- Global tracker `/dashboard` — all keys + all platforms combined
- Project tracker `/projects/[id]` — per-project costs, independent budgets and alerts

**Platforms supported at launch:** OpenAI · Anthropic · Gemini · AWS · Azure · Mistral · Cohere · Custom

---

## Stack

```
Next.js 15 App Router    TypeScript strict mode
Tailwind CSS v4          shadcn/ui New York zinc
Supabase                 Razorpay
Resend                   Recharts
React Hook Form + Zod    TanStack Table v8
TanStack Query v5        Zustand
Framer Motion            Lucide React
next-themes              Syne + JetBrains Mono
```

---

## Design tokens

```css
--bg-base:        #09111f;
--bg-card:        #0c1a2e;
--bg-sidebar:     #060d18;
--bg-elevated:    #0f2040;
--border:         #1e3a5f;
--border-subtle:  #152a45;
--brand:          #4f46e5;
--brand-hover:    #4338ca;
--success:        #10b981;
--danger:         #ef4444;
--warning:        #f59e0b;
--text-primary:   #e2e8f0;
--text-secondary: #94a3b8;
--text-muted:     #4a6380;
```

Fonts: Syne (UI text) + JetBrains Mono (keys, numbers, code). Both via next/font/google.
All numbers: tabular-nums CSS class always.
Default: dark mode. Both dark and light modes fully implemented.

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
    layout.tsx                   ← sidebar + topbar shell
    /dashboard/page.tsx          ← global tracker
    /projects
      page.tsx                   ← all projects list
      /[id]/page.tsx             ← single project tracker
    /keys
      page.tsx                   ← all keys list
      /[id]/page.tsx             ← key detail
    /costs/page.tsx              ← cost analytics
    /estimator/page.tsx          ← cost calculator
    /budgets/page.tsx            ← budget management
    /alerts/page.tsx             ← notifications
    /reports/page.tsx            ← monthly reports
    /settings
      /profile/page.tsx
      /security/page.tsx
      /notifications/page.tsx
      /billing/page.tsx
      /team/page.tsx

  /(marketing)
    /page.tsx                    ← landing page
    /pricing/page.tsx
    /security/page.tsx

  /api
    /webhooks/razorpay/route.ts
    /cron/sync-usage/route.ts
    /cron/check-budgets/route.ts
    /cron/price-alerts/route.ts
    /cron/monthly-report/route.ts
    /cron/waste-detection/route.ts

/components
  /ui/                           ← shadcn/ui — never edit directly
  /app
    /layout
      sidebar.tsx
      topbar.tsx
      app-shell.tsx
      mobile-nav.tsx
      command-palette.tsx
    /dashboard
      kpi-cards.tsx
      spend-chart.tsx
      platform-breakdown.tsx
      top-keys-table.tsx
      key-health-grid.tsx
      recent-alerts-panel.tsx
      demo-banner.tsx
    /projects
      project-card.tsx
      project-list.tsx
      project-detail.tsx
      create-project-dialog.tsx
      assign-keys-dialog.tsx
      compare-view.tsx
    /keys
      key-list.tsx
      key-card.tsx
      key-detail.tsx
      add-key-dialog.tsx
      masked-key.tsx
      key-status-badge.tsx
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
      provider-logo.tsx

/lib
  env.ts                         ← Zod env validation — runs at startup
  /supabase
    client.ts                    ← browser client
    server.ts                    ← server client
    admin.ts                     ← service role (cron + webhooks only)
  /encryption
    index.ts                     ← AES-256-GCM encrypt/decrypt
  /platforms
    index.ts                     ← unified registry
    openai.ts
    anthropic.ts
    gemini.ts
    aws.ts
    azure.ts
    mistral.ts
    cohere.ts
    custom.ts
  /razorpay
    client.ts
    helpers.ts
    webhooks.ts
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
    cn.ts

/hooks
  use-keys.ts
  use-projects.ts
  use-usage.ts
  use-budgets.ts
  use-alerts.ts
  use-subscription.ts

/stores
  ui-store.ts
  filter-store.ts

/types
  database.ts
  platform.ts

/styles
  globals.css

/public
  /logos

/skills                          ← expert code patterns — read before each session
  SKILLS_INDEX.md
  SKILL_01_ARCHITECTURE.md
  SKILL_02_DATABASE.md
  SKILL_03_SECURITY.md
  SKILL_04_FRONTEND.md
  SKILL_05_PAYMENTS.md
  SKILL_06_DEVOPS.md
  SKILL_07_AI_PLATFORMS.md
```

---

## Database tables

profiles · subscriptions · projects · api_keys · project_keys
usage_records · budgets · alerts · price_snapshots · saved_estimates

Full SQL in SCHEMA.md. RLS on every table — no exceptions.

---

## Skills reference

All code patterns written by 7 domain experts live in the /skills/ folder.
Read skills/SKILLS_INDEX.md first to find which files cover your current session.
Never read all skill files at once — only read the ones listed for your session.

```
skills/SKILLS_INDEX.md           ← start here — maps every session to skill files
skills/SKILL_01_ARCHITECTURE.md  ← FSA — Next.js, TypeScript, Server Actions, conventions
skills/SKILL_02_DATABASE.md      ← DBE — PostgreSQL, queries, RLS, indexes, upsert
skills/SKILL_03_SECURITY.md      ← SEC — AES-256-GCM encryption, auth, env validation
skills/SKILL_04_FRONTEND.md      ← FEX — components, skeletons, empty states, TanStack Query
skills/SKILL_05_PAYMENTS.md      ← PAY — Razorpay plans, webhook handler, subscription states
skills/SKILL_06_DEVOPS.md        ← DVO — Vercel config, cron jobs, scale, infra
skills/SKILL_07_AI_PLATFORMS.md  ← AIX — platform interface, cost calculation, format utilities
```

---

## Pricing data (March 2026)

### OpenAI
gpt-4o: $2.50/$10.00 per MTok · gpt-4o-mini: $0.15/$0.60 · o3: $2.00/$8.00 · o4-mini: $1.10/$4.40

### Anthropic
claude-opus-4-6: $5.00/$25.00 · claude-sonnet-4-6: $3.00/$15.00 · claude-haiku-4-5: $1.00/$5.00 · claude-haiku-3: $0.25/$1.25

### Gemini
gemini-2.5-pro: $1.25/$10.00 · gemini-2.5-flash: $0.30/$2.50 · gemini-2.5-flash-lite: $0.10/$0.40

### AWS Bedrock
meta.llama4-maverick: $0.18/$0.90 · amazon.titan-text-express: $0.20/$0.60

### Azure OpenAI
gpt-4o: $2.50/$10.00 · gpt-4o-mini: $0.15/$0.60

### Mistral
mistral-large: $2.00/$6.00 · mistral-medium: $0.40/$1.20 · mistral-small: $0.10/$0.30 · codestral: $0.30/$0.90

### Cohere
command-r-plus: $2.50/$10.00 · command-r: $0.15/$0.60 · embed-english-v3: $0.10/$0.00

---

## Razorpay billing

Monthly plan: ₹41,500 paise (₹415) displayed as ~$4.99 USD
Annual plan: ₹4,14,900 paise (₹4,149) displayed as ~$49.99 USD
Trial: 7 days, payment method required upfront

Webhook events: subscription.activated · subscription.charged · subscription.halted · subscription.cancelled · payment.failed

---

## Security rules — absolute

1. AES-256-GCM encryption on every stored API key
2. Never store or log plaintext keys
3. Show only last 4 characters in UI (sk-...4f8b)
4. Decrypt only immediately before platform API call
5. RLS on every Supabase table
6. Razorpay webhook verified with HMAC-SHA256
7. All env vars validated with Zod at startup — crash with clear message if missing
8. Rate limits: 5 login attempts/15min, 20 key creations/hour/user

---

## Coding rules

1. TypeScript strict — zero `any` types — treat as build error
2. Server Components by default — `'use client'` only for DOM/browser APIs
3. Server Actions for mutations — not client-side API calls
4. API routes only for webhooks and cron jobs
5. Zod validates 100% of user input before any DB write
6. Every async function: typed try/catch, typed return value
7. Every list/table: loading skeleton + illustrated empty state + error state
8. `cn()` from /lib/utils/cn.ts for all conditional classes
9. Named exports everywhere except page.tsx and layout.tsx
10. File names: kebab-case. Component names: PascalCase

---

## Build order

Session 1: Scaffold + Auth
Session 2: Encryption + Key CRUD
Session 3: OpenAI Usage Data
Session 4: Global Dashboard
Session 5: Project Tracker
Session 6: Budgets + Alerts
Session 7: Cost Estimator
Session 8: All 7 Named Platforms
Session 9: Custom Platforms
Session 10: Razorpay Billing
Session 11: Advanced Alerts
Session 12: Settings + Reports
Session 13: Landing Page
Session 14: Polish
Session 15: Pre-launch

See BUILD_SESSIONS.md for the exact prompt to paste for each session.
See skills/SKILLS_INDEX.md for which skill files to read per session.
