# API Lens — Project Structure

This file explains what every folder and file does in plain language.
Reference this when you are unsure where something should go.

---

## Top-level folders

```
api-lens/
├── app/              ← All pages and API routes (Next.js App Router)
├── components/       ← All React components
├── lib/              ← All business logic, utilities, integrations
├── hooks/            ← Custom React hooks for data fetching
├── stores/           ← Global UI state (Zustand)
├── types/            ← TypeScript type definitions
├── styles/           ← Global CSS
├── public/           ← Static files (images, logos)
├── CLAUDE.md         ← Claude Code reads this automatically
├── SKILLS.md         ← Code patterns reference
├── PLATFORMS.md      ← Platform API integration details
├── .env.local        ← Your secrets (never commit this)
└── .env.example      ← Template showing what variables are needed
```

---

## The /app folder

This is where all your pages live. Next.js uses the folder name as the URL.

```
app/
├── (auth)/           ← Pages users see when NOT logged in
│   ├── login/        → URL: /login
│   ├── signup/       → URL: /signup
│   └── forgot-password/ → URL: /forgot-password
│
├── (app)/            ← Pages users see when logged IN
│   ├── layout.tsx    ← The sidebar + topbar that wraps every page
│   ├── dashboard/    → URL: /dashboard (global tracker)
│   ├── projects/     → URL: /projects (project list)
│   │   └── [id]/     → URL: /projects/abc123 (single project)
│   ├── keys/         → URL: /keys (all API keys)
│   │   └── [id]/     → URL: /keys/abc123 (single key detail)
│   ├── costs/        → URL: /costs (cost analytics)
│   ├── estimator/    → URL: /estimator (cost calculator)
│   ├── budgets/      → URL: /budgets (budget management)
│   ├── alerts/       → URL: /alerts (all notifications)
│   ├── reports/      → URL: /reports (monthly reports)
│   └── settings/
│       ├── profile/  → URL: /settings/profile
│       ├── security/ → URL: /settings/security
│       ├── billing/  → URL: /settings/billing
│       └── team/     → URL: /settings/team
│
├── (marketing)/      ← Public pages (no login needed)
│   ├── page.tsx      → URL: / (landing page)
│   ├── pricing/      → URL: /pricing
│   └── security/     → URL: /security
│
└── api/              ← Background processes (not pages)
    ├── webhooks/
    │   └── razorpay/ ← Razorpay sends payment events here
    └── cron/
        ├── sync-usage/      ← Runs every 15 min — fetches spend from all platforms
        ├── check-budgets/   ← Runs after sync — checks if any budget is hit
        ├── price-alerts/    ← Runs daily — detects pricing changes
        ├── monthly-report/  ← Runs 1st of month — sends report emails
        └── waste-detection/ ← Runs daily — finds inactive keys
```

---

## The /components folder

Split into two sections:

```
components/
├── ui/               ← shadcn/ui components — NEVER edit these directly
│                        (Button, Card, Dialog, Input, Table, etc.)
│
└── app/              ← Your custom components
    ├── layout/       ← The app shell (sidebar, topbar, mobile nav)
    ├── dashboard/    ← Components only used on the dashboard page
    ├── projects/     ← Components only used on project pages
    ├── keys/         ← Components only used on key management pages
    ├── costs/        ← Components only used on costs page
    ├── estimator/    ← Components only used on estimator page
    ├── budgets/      ← Components only used on budgets page
    ├── alerts/       ← Components only used on alerts page
    ├── charts/       ← Reusable chart components (area, bar, sparkline)
    └── shared/       ← Used on multiple pages
        ├── empty-state.tsx    ← "Nothing here yet" with icon + button
        ├── error-state.tsx    ← "Something went wrong" with retry
        ├── loading-skeleton.tsx ← Grey placeholder while loading
        ├── stat-card.tsx      ← KPI number card
        ├── page-header.tsx    ← Page title + action buttons
        ├── confirm-dialog.tsx ← "Are you sure?" popup
        └── provider-logo.tsx  ← Platform logos (OpenAI, Anthropic etc.)
```

---

## The /lib folder

All the core logic that is not UI.

```
lib/
├── env.ts            ← Checks all environment variables exist at startup
│
├── supabase/
│   ├── client.ts     ← Use in browser components ('use client')
│   ├── server.ts     ← Use in Server Components and Server Actions
│   └── admin.ts      ← Use only in cron jobs and webhooks
│
├── encryption/
│   └── index.ts      ← encrypt() and decrypt() for API keys
│
├── platforms/
│   ├── index.ts      ← Master list of all 8 platforms
│   ├── openai.ts     ← OpenAI usage API connection
│   ├── anthropic.ts  ← Anthropic usage API connection
│   ├── gemini.ts     ← Google Gemini usage API connection
│   ├── aws.ts        ← AWS Bedrock usage API connection
│   ├── azure.ts      ← Azure OpenAI usage API connection
│   ├── mistral.ts    ← Mistral usage API connection
│   ├── cohere.ts     ← Cohere usage API connection
│   └── custom.ts     ← Manual entry for custom platforms
│
├── razorpay/
│   ├── client.ts     ← Razorpay SDK instance
│   ├── helpers.ts    ← Create subscription, check status
│   ├── webhooks.ts   ← Handle payment events
│   └── plans.ts      ← Monthly and annual plan definitions
│
├── email/
│   ├── client.ts     ← Resend instance
│   └── templates/    ← Email designs (React Email)
│       ├── welcome.tsx
│       ├── alert-budget.tsx
│       ├── alert-spike.tsx
│       ├── trial-ending.tsx
│       ├── trial-expired.tsx
│       ├── monthly-report.tsx
│       └── rotation-reminder.tsx
│
├── validations/      ← Zod schemas for form data
│   ├── key.ts        ← Add/edit API key form
│   ├── project.ts    ← Create/edit project form
│   ├── budget.ts     ← Set budget form
│   └── user.ts       ← Profile update form
│
└── utils/
    ├── format.ts     ← formatUsd(), formatDate(), formatTokens()
    ├── cost.ts       ← calculateCost(), estimateMonthly()
    ├── anomaly.ts    ← detectSpike() — 3× daily average check
    ├── waste.ts      ← findInactiveKeys() — 30 day inactivity check
    └── cn.ts         ← Tailwind class merging utility
```

---

## The /hooks folder

These connect your UI to your database using TanStack Query.

```
hooks/
├── use-keys.ts         ← useKeys(), useDeleteKey(), useAddKey()
├── use-projects.ts     ← useProjects(), useProject(id)
├── use-usage.ts        ← useDailySpend(), useSpendByPlatform(), useTotalMtd()
├── use-budgets.ts      ← useBudgets(), useSetBudget()
├── use-alerts.ts       ← useAlerts(), useUnreadCount(), useMarkRead()
└── use-subscription.ts ← useSubscription(), useIsSubscribed()
```

---

## The /stores folder

Global state that multiple components need to share.

```
stores/
├── ui-store.ts       ← Is sidebar open? Which modal is showing?
└── filter-store.ts   ← What date range is selected on dashboard?
```

---

## Key rules for where things go

| You are building... | It goes in... |
|---------------------|---------------|
| A new page | /app/(app)/[pagename]/page.tsx |
| A component used on one page | /components/app/[pagename]/ |
| A component used on many pages | /components/app/shared/ |
| Logic that talks to the database | /lib/ as a Server Action |
| Logic that fetches data for the UI | /hooks/ as a TanStack Query hook |
| A form schema | /lib/validations/ |
| A utility function | /lib/utils/ |
| A platform API connection | /lib/platforms/ |
| A background job | /app/api/cron/ |
| A payment webhook | /app/api/webhooks/ |
