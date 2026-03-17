# API Lens — Project Structure
# What every folder and file does. Reference this when unsure where something goes.

---

## Top-level

```
api-lens/
├── app/                  ← All pages and API routes (Next.js App Router)
├── components/           ← All React components
├── lib/                  ← Business logic, utilities, integrations
├── hooks/                ← TanStack Query data-fetching hooks
├── stores/               ← Zustand global UI state
├── types/                ← TypeScript type definitions
├── styles/               ← Global CSS
├── public/               ← Static files (logos, images)
├── CLAUDE.md             ← Claude Code reads this every session
├── PLATFORMS.md          ← Platform API integration details
├── SCHEMA.md             ← Run once on fresh Supabase project
├── .env.local            ← Your secrets — never commit this
├── .env.example          ← Template showing all required variables
├── vercel.json           ← Exactly 2 cron jobs
└── next.config.ts        ← Security headers, image config
```

---

## /app folder

```
app/
├── (auth)/               ← Pages for users who are NOT logged in
│   ├── login/
│   │   └── page.tsx      → URL: /login
│   ├── signup/
│   │   └── page.tsx      → URL: /signup
│   ├── forgot-password/
│   │   └── page.tsx      → URL: /forgot-password
│   ├── reset-password/
│   │   └── page.tsx      → URL: /reset-password
│   └── layout.tsx        ← Centered card layout, no sidebar
│
├── (app)/                ← Pages for users who ARE logged in
│   ├── layout.tsx        ← Sidebar + topbar that wraps every page
│   ├── onboarding/
│   │   └── page.tsx      → URL: /onboarding (3-step wizard)
│   ├── dashboard/
│   │   └── page.tsx      → URL: /dashboard (global tracker)
│   ├── projects/
│   │   ├── page.tsx      → URL: /projects (project list)
│   │   └── [id]/
│   │       └── page.tsx  → URL: /projects/abc123 (single project)
│   ├── keys/
│   │   ├── page.tsx      → URL: /keys (all API keys)
│   │   └── [id]/
│   │       └── page.tsx  → URL: /keys/abc123 (key detail + sync status)
│   ├── costs/
│   │   └── page.tsx      → URL: /costs (cost analytics)
│   ├── estimator/
│   │   └── page.tsx      → URL: /estimator (cost calculator)
│   ├── budgets/
│   │   └── page.tsx      → URL: /budgets (budget management)
│   ├── alerts/
│   │   └── page.tsx      → URL: /alerts (notification feed)
│   ├── reports/
│   │   └── page.tsx      → URL: /reports (monthly reports)
│   └── settings/
│       ├── profile/
│       │   └── page.tsx  → URL: /settings/profile
│       ├── security/
│       │   └── page.tsx  → URL: /settings/security
│       ├── notifications/
│       │   └── page.tsx  → URL: /settings/notifications
│       ├── billing/
│       │   └── page.tsx  → URL: /settings/billing
│       └── team/
│           └── page.tsx  → URL: /settings/team ("coming soon" only)
│
├── (marketing)/          ← Public pages — no login required
│   ├── page.tsx          → URL: / (landing page)
│   ├── pricing/
│   │   └── page.tsx      → URL: /pricing
│   └── security/
│       └── page.tsx      → URL: /security
│
└── api/                  ← Background processes — not pages
    ├── webhooks/
    │   └── razorpay/
    │       └── route.ts  ← Razorpay sends payment events here
    ├── cron/
    │   ├── sync-and-check/
    │   │   └── route.ts  ← Runs every 15 min — syncs all platforms, checks budgets
    │   └── daily-tasks/
    │       └── route.ts  ← Runs 7am UTC — OpenRouter diff, price check, waste, rotation, report
    └── platforms/
        ├── route.ts      ← GET all 14 platforms for intelligence panel
        ├── [id]/
        │   └── route.ts  ← GET single platform by ID
        └── detect/
            └── route.ts  ← POST {apiKey} → {platformId, confidence}
```

---

## /components folder

```
components/
├── ui/                        ← shadcn/ui components — NEVER edit these directly
│                                 (Button, Card, Dialog, Input, Table, Badge, etc.)
│
└── app/                       ← Custom components
    ├── layout/                ← The app shell
    │   ├── sidebar.tsx        ← Nav sidebar; shows company_name below logo if set
    │   ├── topbar.tsx         ← Top bar with search, alerts badge, user menu
    │   ├── app-shell.tsx      ← Combines sidebar + topbar + main content area
    │   ├── mobile-nav.tsx     ← Bottom tab navigation for mobile (max 5 tabs)
    │   └── command-palette.tsx ← ⌘K command palette (only keyboard shortcut)
    │
    ├── onboarding/            ← 3-step onboarding wizard components
    │   ├── role-step.tsx      ← Role cards + optional company name field
    │   ├── project-step.tsx   ← Project name + 12-colour picker
    │   └── key-step.tsx       ← Inline add-key form with auto-assign
    │
    ├── dashboard/             ← Global dashboard components
    │   ├── kpi-cards.tsx      ← 4 MTD stat cards with skeletons
    │   ├── spend-chart.tsx    ← Area chart — daily spend last 30 days
    │   ├── platform-breakdown.tsx ← Bar chart — spend by platform
    │   ├── top-keys-table.tsx ← Top 5 keys by spend
    │   ├── key-health-grid.tsx ← Key status badges grid
    │   ├── recent-alerts-panel.tsx ← Last 5 alerts
    │   └── demo-banner.tsx    ← "You're viewing demo data" banner
    │
    ├── keys/                  ← Key management components
    │   ├── key-list.tsx       ← Table of all keys with TanStack Table
    │   ├── key-detail.tsx     ← Single key detail view with sync history
    │   ├── add-key-dialog.tsx ← Two-column dialog: form + intelligence panel
    │   ├── masked-key.tsx     ← Displays sk-...4f8b format
    │   ├── key-status-badge.tsx ← active / invalid / rotation-due / inactive
    │   ├── provider-logo.tsx  ← Platform logo by provider ID
    │   ├── key-intelligence-panel.tsx ← Right panel with platform info
    │   ├── encryption-badge.tsx ← Green lock badge above save button
    │   └── encryption-animation.tsx ← 2-second scramble animation on save
    │
    ├── projects/              ← Project tracker components
    │   ├── project-card.tsx   ← Card with spend, budget, colour label
    │   ├── create-project-dialog.tsx ← Name + colour picker
    │   ├── assign-keys-dialog.tsx ← Multi-select keys to assign
    │   └── compare-view.tsx   ← Side-by-side 2 or 3 project comparison
    │
    ├── costs/                 ← Cost analytics components
    │   ├── cost-table.tsx     ← Detailed cost breakdown table
    │   ├── cost-trend-chart.tsx ← Multi-series trend chart
    │   └── platform-pie-chart.tsx ← Donut chart by platform
    │
    ├── estimator/             ← Cost estimator components
    │   ├── estimator-form.tsx ← Platform/model inputs + instant calculation
    │   ├── comparison-table.tsx ← All 14 platforms ranked by cost
    │   ├── model-swap-suggestion.tsx ← "Switch to X, save $Y/month"
    │   └── save-estimate-dialog.tsx ← Name + link to project
    │
    ├── budgets/               ← Budget management components
    │   ├── budget-card.tsx    ← Progress bar + threshold badges
    │   └── set-budget-dialog.tsx ← Scope selector + amount + thresholds
    │
    ├── alerts/                ← Alerts feed components
    │   ├── alert-feed.tsx     ← Full page alert list
    │   ├── alert-item.tsx     ← Single alert row with icon + severity
    │   └── alert-badge.tsx    ← Unread count badge for sidebar
    │
    ├── charts/                ← Reusable chart components (Recharts)
    │   ├── area-chart.tsx     ← Gap-filled daily spend chart
    │   ├── bar-chart.tsx      ← Platform breakdown chart
    │   └── sparkline.tsx      ← Inline mini chart for tables
    │
    └── shared/                ← Used across multiple pages
        ├── empty-state.tsx    ← Icon + title + description + action button
        ├── error-state.tsx    ← Error message + retry button
        ├── loading-skeleton.tsx ← KpiCardSkeleton, TableRowSkeleton, ChartSkeleton
        ├── stat-card.tsx      ← KPI number card component
        ├── page-header.tsx    ← Page title + description + action buttons
        ├── confirm-dialog.tsx ← "Are you sure?" modal
        └── last-synced.tsx    ← "Last synced X minutes ago" display
```

---

## /lib folder

```
lib/
├── env.ts                     ← Validates all env vars with Zod at startup
│
├── supabase/
│   ├── client.ts              ← Browser Supabase client (use in 'use client' components)
│   ├── server.ts              ← Server Supabase client (use in Server Components + Actions)
│   └── admin.ts               ← Service role client (use ONLY in cron + webhooks)
│
├── encryption/
│   └── index.ts               ← encrypt(), decrypt(), getKeyHint(), maskForDisplay()
│
├── platforms/
│   ├── index.ts               ← Routes calls to correct adapter via detected_pattern
│   ├── registry.ts            ← Loads platform metadata from DB with 5-min cache
│   └── adapters/
│       ├── pattern1-openai-compatible.ts  ← OpenRouter
│       ├── pattern2-custom-token.ts       ← OpenAI, Anthropic, Mistral, Cohere
│       ├── pattern3-per-unit.ts           ← ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal
│       └── pattern4-cloud-billing.ts      ← Gemini, Vertex AI, Azure OpenAI, AWS Bedrock
│
├── razorpay/
│   ├── client.ts              ← Razorpay SDK instance
│   ├── helpers.ts             ← createSubscription(), getSubscriptionStatus()
│   └── plans.ts               ← PLANS constant with paise amounts (single source of truth)
│
├── email/
│   ├── client.ts              ← Resend instance
│   └── templates/             ← React Email templates
│       ├── welcome.tsx
│       ├── alert-budget.tsx
│       ├── alert-spike.tsx
│       ├── trial-ending.tsx
│       ├── trial-expired.tsx
│       ├── monthly-report.tsx
│       └── rotation-reminder.tsx
│
├── validations/               ← Zod schemas for form inputs
│   ├── key.ts                 ← Add/edit API key schema
│   ├── project.ts             ← Create/edit project schema
│   ├── budget.ts              ← Set budget schema
│   └── user.ts                ← Profile update schema
│
└── utils/
    ├── cn.ts                  ← Tailwind class merging (clsx + twMerge)
    ├── format.ts              ← formatUsd(), formatTokens(), formatUnits(), formatRelativeTime()
    ├── cost.ts                ← calculateCostUsd(), estimateMonthlyUsd(), calculateModelSwapSavings()
    ├── anomaly.ts             ← detectSpike() — 3× daily average detection
    ├── waste.ts               ← findInactiveKeys() — 30+ day inactivity
    ├── budget-check.ts        ← checkBudget() — called by sync-and-check cron
    ├── price-check.ts         ← checkPriceChanges() — called by daily-tasks cron
    └── monthly-report.ts      ← generateMonthlyReports() — called by daily-tasks on 1st
```

---

## /hooks folder

TanStack Query hooks that connect UI components to Supabase.

```
hooks/
├── use-keys.ts              ← useKeys(), useKey(id), useAddKey(), useDeleteKey(), useToggleKey()
├── use-projects.ts          ← useProjects(), useProject(id), useCreateProject()
├── use-usage.ts             ← useDailySpend(), useSpendByPlatform(), useTotalMtd(), useTopKeys()
├── use-budgets.ts           ← useBudgets(), useSetBudget(), useDeleteBudget()
├── use-alerts.ts            ← useAlerts(), useUnreadCount(), useMarkRead(), useMarkAllRead()
├── use-subscription.ts      ← useSubscription(), useIsSubscribed(), usePlan()
└── use-platforms.ts         ← usePlatforms(), usePlatform(id)
```

---

## /stores folder

Zustand stores for global UI state (not data — data goes in TanStack Query).

```
stores/
├── ui-store.ts              ← Is sidebar open? Which modal is showing? Command palette open?
└── filter-store.ts          ← Date range selection on dashboard and cost pages
```

---

## /types folder

```
types/
├── database.ts              ← TypeScript types matching all Supabase tables (generated or manual)
└── platform.ts              ← UsageRecord, UnitType, AdapterPattern interfaces
```

---

## Where things go — decision table

| You are building... | It goes in... |
|---|---|
| A new page | `/app/(app)/[pagename]/page.tsx` |
| A component used on one page | `/components/app/[pagename]/` |
| A component used on multiple pages | `/components/app/shared/` |
| A database mutation | `/lib/` as a Server Action |
| A data-fetching hook for the UI | `/hooks/` as a TanStack Query hook |
| A form validation schema | `/lib/validations/` |
| A utility function | `/lib/utils/` |
| A platform API adapter | `/lib/platforms/adapters/` |
| A background job | `/app/api/cron/` |
| A payment webhook | `/app/api/webhooks/` |
| Shared UI types | `/types/` |
| Environment variable access | Import from `/lib/env.ts` |
