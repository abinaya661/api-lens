# API Lens — Internal Team Guide

**Version:** 1.2 | **Date:** March 26, 2026 | **Classification:** Internal — Engineering & Product

---

## Table of Contents

1. [What Is API Lens?](#1-what-is-api-lens)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [What's Been Done (Completed Work)](#5-whats-been-done-completed-work)
6. [What's Pending (Current State)](#6-whats-pending-current-state)
7. [Roadmap — What Needs to Be Done](#7-roadmap--what-needs-to-be-done)
8. [For Frontend Developers](#8-for-frontend-developers)
9. [For Backend Developers](#9-for-backend-developers)
10. [For Product Managers](#10-for-product-managers)
11. [Database Schema](#11-database-schema)
12. [API Reference](#12-api-reference)
13. [Security Architecture](#13-security-architecture)
14. [Testing Strategy](#14-testing-strategy)
15. [Environment Setup](#15-environment-setup)
16. [Deployment](#16-deployment)

---

## 1. What Is API Lens?

API Lens is a **SaaS dashboard for monitoring, managing, and optimizing AI API spending** across multiple providers. Think of it as "Datadog for AI API costs."

**Core Value Proposition:** Teams using multiple AI providers (OpenAI, Anthropic, Google Gemini, etc.) lose track of spending. API Lens aggregates usage data, sets budget alerts, and helps teams optimize costs — all from a single dashboard.

**Key User Flows:**
1. Sign up → Onboarding wizard → Add API keys → See spending dashboard
2. Set budgets → Receive alerts when thresholds are crossed
3. Use the cost estimator to compare model pricing before committing
4. View reports, export CSV, track trends over time

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│  Landing Page │ Auth Pages │ Dashboard │ Settings │ Onboarding  │
│  React Query (state) │ shadcn/ui │ Tailwind CSS │ Recharts     │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Server Actions + API Routes
┌─────────────────────────▼───────────────────────────────────────┐
│                        BACKEND (Next.js API)                    │
│  Server Actions (lib/actions/) │ API Routes (app/api/)          │
│  Zod Validation │ Rate Limiting │ CSRF Protection               │
└──────┬──────────────┬──────────────┬───────────────┬────────────┘
       │              │              │               │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Supabase   │ │ Provider  │ │   Dodo     │ │  Upstash   │
│  (Auth+DB)  │ │ Adapters  │ │ Payments   │ │  Redis     │
│  + RLS      │ │ (9 APIs)  │ │ (Billing)  │ │ (Rate Lim) │
└─────────────┘ └───────────┘ └────────────┘ └────────────┘
       │
┌──────▼───────────────────────────────────────────────────┐
│  Vercel Cron (4 jobs):                                   │
│  sync-and-check (every 6h) │ daily-tasks (7AM UTC)      │
│  key-health-check (6AM UTC) │ weekly-report (Mon 8AM)   │
│  Syncs usage from providers → Upserts to usage_records   │
│  Checks budgets → Creates alerts → Sends emails          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15.2 (App Router, Turbopack) | Full-stack React framework |
| **Language** | TypeScript 5.8 (strict mode) | Type safety |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Lucide icons | UI design system |
| **State** | TanStack React Query 5 | Server state management |
| **Charts** | Recharts 2.15 | Data visualization |
| **Auth & DB** | Supabase (Auth + PostgreSQL + RLS) | User auth + database |
| **Payments** | Dodo Payments 2.23 | Subscription billing (MoR) |
| **Email** | Resend | Transactional emails |
| **Rate Limiting** | Upstash Redis | Sliding window rate limits |
| **Encryption** | AES-256-GCM (envelope encryption) | API key storage |
| **Analytics** | PostHog | Product analytics |
| **Error Tracking** | Sentry | Error monitoring |
| **Testing** | Vitest (unit) + Playwright (e2e) | Automated testing |
| **CI/CD** | GitHub Actions + Vercel | Build, test, deploy |
| **Package Manager** | pnpm | Dependency management |

---

## 4. Folder Structure

```
api-lens/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth pages (login, signup, forgot/reset password, verify)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── dashboard/            # Main spending overview
│   │   ├── keys/                 # API key management (list + [id] detail)
│   │   ├── projects/             # Project organization (list + [id] detail)
│   │   ├── budgets/              # Budget configuration
│   │   ├── alerts/               # Alert notifications
│   │   ├── reports/              # Usage reports + CSV export
│   │   ├── estimator/            # Cost calculator
│   │   ├── onboarding/           # 3-step onboarding wizard
│   │   ├── settings/             # Profile, billing, notifications
│   │   └── subscription/         # Plan selection + upgrade
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints (CRON_SECRET auth)
│   │   ├── cron/                 # Vercel cron handlers
│   │   ├── health/               # Health check
│   │   ├── platforms/            # Platform registry + key detection
│   │   ├── subscription/        # Dodo checkout session
│   │   └── webhooks/             # Dodo webhook handler
│   ├── auth/callback/            # OAuth callback
│   └── (public pages)            # privacy, terms, security, 404
├── components/
│   ├── dashboard/                # Metric cards, charts, provider breakdown
│   ├── landing/                  # Hero, pricing, features, marquee
│   ├── layout/                   # Sidebar, header, mobile nav
│   ├── shared/                   # Page header, stat card, empty/error states, skeletons
│   └── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
├── hooks/                        # React Query hooks (use-keys, use-dashboard, etc.)
├── lib/
│   ├── actions/                  # Server actions (auth, keys, budgets, etc.)
│   ├── dodo/                     # Dodo Payments SDK (lazy proxy)
│   ├── encryption/               # AES-256-GCM envelope encryption
│   ├── platforms/
│   │   ├── adapters/             # Per-provider adapters (9 providers)
│   │   ├── base.ts               # Base adapter class
│   │   ├── registry.ts           # Adapter lookup
│   │   ├── sync-engine.ts        # Cron sync logic
│   │   └── types.ts              # Adapter interfaces
│   ├── ratelimit/                # Upstash Redis rate limiters
│   ├── supabase/                 # Client, server, admin Supabase clients
│   ├── utils/                    # Helpers (audit, csrf, key-health, safe-redirect)
│   └── validations/              # Zod schemas (key, project, budget, settings)
├── types/                        # TypeScript types (database, api, providers)
├── supabase/migrations/          # 6 SQL migrations
├── tests/                        # 8 Vitest test files
├── e2e/                          # Playwright e2e tests
├── public/                       # Static assets
├── middleware.ts                  # Auth redirect, geo-detection, security headers
├── vercel.json                   # Cron schedule
└── .github/workflows/ci.yml      # CI pipeline
```

---

## 5. What's Been Done (Completed Work)

### Phase 0 — Foundation (COMPLETE)
- [x] Next.js 15 project scaffolding with TypeScript strict mode
- [x] Supabase integration (auth + DB + RLS policies)
- [x] Database schema: profiles, projects, api_keys, usage_records, budgets, alerts, platforms, price_snapshots
- [x] AES-256-GCM envelope encryption for API key storage
- [x] Middleware: auth redirect, security headers, geo-country detection
- [x] CI/CD pipeline (GitHub Actions: lint → type-check → build → test)

### Phase 1 — Core Features (COMPLETE)
- [x] Email/password authentication + Google OAuth
- [x] Onboarding wizard (3-step: welcome → add key → set budget)
- [x] API key CRUD with validation against provider APIs
- [x] 9 provider adapters: OpenAI, Anthropic, Gemini, Grok, Azure OpenAI, Moonshot, DeepSeek, ElevenLabs, OpenRouter
- [x] Dashboard with spend overview, charts, provider breakdown
- [x] Project management (organize keys by project)
- [x] Budget system with 4-tier alerts (50%, 75%, 90%, 100%)
- [x] Alert feed with read/unread management
- [x] Reports page with date filtering and CSV export
- [x] Cost estimator with model pricing comparison
- [x] Settings (profile, timezone, currency, notifications)

### Phase 2 — Sync & Automation (COMPLETE)
- [x] Sync engine: cron-based usage fetching from all providers
- [x] Key health monitoring: consecutive failure tracking, auto-deactivation after 5 failures
- [x] Daily tasks cron: waste detection (30+ day inactive keys), rotation reminders (80+ day old keys)
- [x] Budget threshold checking with alert creation
- [x] Rate limiting (API: 100/min, Auth: 10/min, Sync: 1/min) with Redis + memory fallback

### Phase 3 — Payments & Billing (COMPLETE)
- [x] Dodo Payments integration (replaced Razorpay)
- [x] Subscription plans: Base Monthly + Base Annual with 7-day trial
- [x] Checkout session creation with per-region product IDs (IN, US, CA, EU, ROW)
- [x] Webhook handler with Standard Webhooks verification + idempotency
- [x] Regional pricing for 50+ countries (USD, EUR, GBP, INR, CAD, etc.)
- [x] EU region grouping for product ID selection
- [x] Discount/promo code system (admin API)
- [x] Access pass system (15-day and 30-day passes)
- [x] Subscription management: upgrade, cancel, status display
- [x] Autopay after trial (card collection at checkout)
- [x] Payment success overlay + redirect to dashboard
- [x] Pro plan "Invite Only" with waitlist (email notify via Resend audience)

### Phase 6 — Email / Mailing System (COMPLETE)
- [x] Resend integration for all transactional emails
- [x] Welcome email on signup (email/password and Google OAuth, sent at /auth/callback)
- [x] Payment success email (subscription.active webhook)
- [x] Payment failed email (payment.failed webhook, 3-day grace period)
- [x] Renewal confirmation email (payment.completed webhook)
- [x] Budget alert emails (50%, 70%, 90%, 100% thresholds)
- [x] Key health alert emails (inactive/unhealthy keys)
- [x] Key rotation reminder emails (80+ day old keys)
- [x] Weekly usage digest emails
- [x] Trial expiration warning emails
- [x] Pro waitlist notification (Resend audience, RESEND_PRO_WAITLIST_ID)
- [x] Branded email template with logo, support link (support@apilens.tech)
- [x] All email links point to apilens.tech domain

### Phase 4 — Security & Polish (COMPLETE)
- [x] Comprehensive security audit (21 issues fixed, 64 tests)
- [x] CSRF protection on mutation endpoints
- [x] Safe redirect validation (prevents open redirects)
- [x] Content Security Policy headers
- [x] Input validation on all forms (Zod schemas, private IP blocking)
- [x] Webhook race condition fix + DB error checking
- [x] Landing page with glass-morphism design, animated marquee, pricing section

### Phase 5 — Enterprise Tier (COMPLETE)
- [x] Enterprise "Coming Soon" tier with email notification
- [x] Enterprise pricing display (regional)

### Phase 7 — Blog / SEO / GEO (COMPLETE)
- [x] MDX blog pipeline: `lib/blog.ts` (gray-matter + remark), `content/blog/*.mdx`
- [x] Blog index page (`/blog`) — glassmorphism cards, dynamic from MDX files
- [x] Blog post page (`/blog/[slug]`) — full article render, custom prose dark styles
- [x] JSON-LD structured data: BlogPosting + BreadcrumbList per post, ItemList on index
- [x] Dynamic sitemap auto-generates blog routes from MDX files
-  - `Blog` in page nav renamed to **`Insights`** (href still `/blog`); **`Pricing`** link added (scrolls to `#pricing` anchor)
- [x] 5 SEO/GEO-optimized posts published (insider-knowledge angle, real incident anchors):
  - `ai-billing-alerts-wont-stop-charges` — $82K Gemini theft, alerts ≠ circuit breakers
  - `ai-agent-infinite-loop-billing-disaster` — $47K agent loop, silent failures
  - `ai-model-cost-comparison-2026` — real cost math, 8 models, switching cost
  - `ai-api-budget-alerts-50-70-90-rule` — 4-tier alert pattern, attribution layer
  - `unified-ai-api-dashboard-multi-provider` — fragmentation tax, unified view

### Phase 8 — Bug Fixes & Polish (COMPLETE — March 26, 2026)
- [x] Fixed all schema field name bugs in sync engine, cron routes (user_id→company_id, encrypted_key→encrypted_credentials, last_used→last_synced_at)
- [x] Fixed alert inserts (scope/scope_id→related_key_id/related_budget_id)
- [x] Fixed weekly-report cron: broken import from non-existent `@/lib/email/templates`, undefined `userIds` variable  
- [x] Added missing `webhook_events` table (migration 007) — prevented Dodo webhook crash
- [x] Added `payment_method_collected` column to subscriptions (migration 007)
- [x] Wired notification preferences to Supabase (`profiles.notification_prefs` JSONB, migration 008)
- [x] Middleware: `/blog` added to public routes (was accidentally auth-gated), geo_country cookie preserved through setAll()
- [x] Blog dependencies installed: `gray-matter`, `remark`, `remark-html`
- [x] Structured data prices corrected ($5.99→$4.99, $59.99→$49.99) + Pro plan offers added
- [x] Landing page nav: Blog→Insights, Pricing link added
- [x] 4 cron jobs now configured in vercel.json (added key-health-check + weekly-report)
- [x] Notification prefs UI now actually saves/loads from DB (was fake setTimeout before)

---

## 6. What's Pending (Current State)

### Immediate Blockers (Must Do Before Launch)
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Run migration 008 SQL in Supabase SQL editor (`notification_prefs` column on profiles) | DevOps | Pending |
| 2 | Create Dodo per-region products → set all `DODO_PRODUCT_*` env vars (10 vars: IN, US, CA, EU, ROW × monthly/annual) | Product/Backend | Blocked |
| 3 | Set up Dodo webhook endpoint → set `DODO_WEBHOOK_SECRET` | Backend | Blocked |
| 4 | Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL=API Lens <noreply@apilens.tech>` in Vercel | DevOps | Blocked |
| 5 | End-to-end smoke tests (signup → checkout → webhook → cancel) | QA/Backend | Not Started |
| 6 | Production deployment (prod Supabase + Dodo live mode + Vercel prod) | DevOps | Not Started |

### Known Gaps
- **Sync frequency:** Vercel cron runs daily (00:00 UTC). For real-time, need upgrade to Pro plan or external scheduler.
- **Providers without usage APIs:** Gemini, Grok, Azure OpenAI, Moonshot return validation-only (no automated cost sync).
- **E2E tests:** Playwright config exists but no e2e test files written yet.
- **Monthly report generation:** Stubbed in daily-tasks cron but not implemented.

---

## 7. Roadmap — What Needs to Be Done

### Sprint 1: Launch Readiness (1-2 weeks)
| Priority | Task | Team |
|----------|------|------|
| P0 | Complete Phase 7 smoke tests with Dodo test mode | Backend + QA |
| P0 | Production Supabase project setup + env vars | DevOps |
| P0 | Dodo live mode activation + product creation | Backend + Product |
| P0 | Vercel production deployment | DevOps |
| P1 | Write 5-10 Playwright e2e tests (critical flows) | Frontend |
| P1 | ~~Email templates for budget alerts~~ — COMPLETE | Backend |
| P1 | Commit and merge uncommitted adapter improvements | Backend |

### Sprint 2: Stability & Monitoring (2-3 weeks)
| Priority | Task | Team |
|----------|------|------|
| P1 | Increase sync frequency (every 6 hours minimum) | Backend |
| P1 | Build monthly report generation (PDF + email) | Backend |
| P1 | Add OpenRouter credit diff tracking | Backend |
| P1 | Price change detection alerts | Backend |
| P2 | Dashboard performance optimization (SSR where possible) | Frontend |
| P2 | Mobile responsive polish | Frontend |
| P2 | Error boundary components for graceful failure | Frontend |

### Sprint 3: Growth Features (4-6 weeks)
| Priority | Task | Team |
|----------|------|------|
| P1 | Team/multi-user support (invite members, role-based access) | Full Stack |
| P1 | Enterprise tier implementation (SSO, audit logs, SLA) | Full Stack |
| P2 | API proxy for real-time cost tracking (per-request metering) | Backend |
| P2 | Slack/Discord/webhook alert integrations | Backend |
| P2 | Custom alert rules (spend spike detection, anomaly alerts) | Backend |
| P3 | Public API for programmatic access | Backend |
| P3 | White-label/embed option for agencies | Full Stack |

### Sprint 4: Scale & Optimize (6-8 weeks)
| Priority | Task | Team |
|----------|------|------|
| P2 | Add more providers (AWS Bedrock, Cohere, Mistral, Replicate) | Backend |
| P2 | Advanced analytics (model comparison, cost-per-output-quality) | Full Stack |
| P2 | Usage forecasting / ML-based projections | Backend |
| P3 | SOC 2 compliance preparation | DevOps + Legal |
| P3 | Self-hosted / on-prem option for enterprise | Architecture |

---

## 8. For Frontend Developers

### Getting Started
```bash
pnpm install
cp .env.example .env.local  # Fill in Supabase keys at minimum
pnpm dev                     # Starts on localhost:3000 with Turbopack
```

### Key Patterns You Must Know

**1. All data fetching goes through custom hooks (hooks/use-*.ts)**
```typescript
// Example: Fetching keys
const { data: keys, isLoading, error } = useKeys();

// Example: Mutation with cache invalidation
const { mutateAsync: addKey } = useAddKey();
await addKey({ provider: 'openai', nickname: 'My Key', api_key: 'sk-...' });
// React Query automatically invalidates ['keys'] and ['dashboard']
```

**2. Pages are client components (use React Query), layouts are server components**
- Every dashboard page uses `'use client'` at the top
- React Query handles loading, error, and refetch states
- Use `<SkeletonLoader variant="..." />` for loading states
- Use `<EmptyState />` and `<ErrorState />` for edge cases

**3. Styling: Dark theme only, glass-morphism design**
- Colors defined as CSS variables in `app/globals.css`
- Brand colors: `brand-50` to `brand-900` (blue spectrum)
- Surface colors: `surface-0` to `surface-500` (dark grays)
- Glass effect: `className="glass-card"` (backdrop-blur + semi-transparent bg)
- Icons: Lucide React (`import { Key, Plus, Trash2 } from 'lucide-react'`)

**4. Component hierarchy**
```
Layout (server) → Page (client) → Custom Hook → Server Action → Supabase
```

**5. Toast notifications via Sonner**
```typescript
import { toast } from 'sonner';
toast.success('Key added successfully');
toast.error('Failed to add key');
```

**6. Navigation**
- Desktop: Sidebar (9 items, collapsible)
- Mobile: Bottom nav bar (6 items, fixed)
- Responsive breakpoint at `lg:` (1024px)

### Files You'll Work With Most
| File | What It Does |
|------|-------------|
| `app/(dashboard)/*/page.tsx` | Dashboard page components |
| `components/dashboard/` | Charts, metric cards, provider breakdown |
| `components/shared/` | Reusable page header, stat cards, skeletons |
| `components/ui/` | shadcn/ui base components |
| `hooks/use-*.ts` | Data fetching hooks |
| `app/globals.css` | Theme variables and custom utilities |

### Common Tasks
- **Add a new dashboard page:** Create `app/(dashboard)/your-page/page.tsx`, add nav item in `components/layout/sidebar.tsx` and `mobile-nav.tsx`
- **Add a new form field:** Update the Zod schema in `lib/validations/`, update the hook in `hooks/`, update the page component
- **New chart:** Use Recharts `<AreaChart>` or `<BarChart>` inside a `<ResponsiveContainer>` with dark theme tooltip

---

## 9. For Backend Developers

### Key Patterns You Must Know

**1. Server Actions are the primary backend (lib/actions/)**
- Each file exports async functions called directly from React components
- All actions authenticate via `createClient()` → `supabase.auth.getUser()`
- Return `{ data }` on success or `{ error: string }` on failure

**2. Adapter Pattern for Providers (lib/platforms/adapters/)**
```typescript
// Every adapter extends BaseAdapter and implements:
abstract class BaseAdapter {
  abstract fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult>;
  abstract validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;
}
```
- To add a new provider: create `adapters/new-provider.ts`, register in `registry.ts`
- Each adapter normalizes usage data into `UsageRow[]` format

**3. Encryption: Never store API keys in plaintext**
```typescript
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';
const encrypted = encryptCredentials(plainKey);  // → EncryptedPayload
const plain = decryptCredentials(encrypted);      // → string
```
- AES-256-GCM with envelope encryption (per-credential DEK wrapped by master key)
- Master key: `ENCRYPTION_KEY` env var (64 hex chars)
- Key hint (last 4 chars) stored separately for display

**4. Rate Limiting**
```typescript
import { authRateLimit, checkRateLimit } from '@/lib/ratelimit';
const { success } = await checkRateLimit(authRateLimit, `login:${email}`);
if (!success) return { error: 'Too many attempts' };
```
- API: 100/min, Auth: 10/min, Sync: 1/min
- Falls back to in-memory if Redis unavailable

**5. Supabase Clients**
| Client | File | Use When |
|--------|------|----------|
| Browser | `lib/supabase/client.ts` | Client components (hooks) |
| Server | `lib/supabase/server.ts` | Server actions (user-scoped, respects RLS) |
| Admin | `lib/supabase/admin.ts` | Cron jobs, webhooks (bypasses RLS) |

**6. Webhook Processing**
- Verified with Standard Webhooks library
- Idempotent via `webhook_events` table (duplicate primary key = skip)
- Race-safe: INSERT with conflict handling

### Files You'll Work With Most
| File | What It Does |
|------|-------------|
| `lib/actions/*.ts` | Server actions (CRUD + business logic) |
| `lib/platforms/adapters/*.ts` | Provider API integrations |
| `lib/platforms/sync-engine.ts` | Cron sync logic |
| `app/api/*/route.ts` | HTTP API endpoints |
| `lib/encryption/index.ts` | Key encryption/decryption |
| `lib/validations/*.ts` | Zod input schemas |
| `supabase/migrations/` | Database schema |
| `middleware.ts` | Request-level auth + headers |

### Common Tasks
- **Add a new provider:** Create adapter in `lib/platforms/adapters/`, add to registry, add to `PROVIDERS` type in `types/providers.ts`, add to validation enum
- **Add a new API route:** Create `app/api/your-route/route.ts`, export `GET`/`POST`/etc.
- **Add a new server action:** Add function to appropriate `lib/actions/*.ts` file, create corresponding hook in `hooks/`
- **Modify DB schema:** Create new migration in `supabase/migrations/`, update types in `types/database.ts`

---

## 10. For Product Managers

### Current Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| User registration (email + Google) | Live | 7-day free trial, welcome email on signup |
| Onboarding wizard | Live | 3 steps: welcome, add key, set budget |
| API key management (9 providers) | Live | Encrypted storage, health monitoring |
| Spending dashboard | Live | Charts, provider breakdown, projections |
| Budget alerts (4 thresholds) | Live | 50%, 75%, 90%, 100% |
| Project organization | Live | Group keys by project |
| Cost estimator | Live | Compare model pricing |
| Reports + CSV export | Live | Date-filtered usage data |
| Subscription billing | Live | Base $4.99/mo or $49.99/yr via Dodo Payments (per-region product IDs) |
| Regional pricing | Live | 50+ countries, local currency |
| Transactional emails | Live | Welcome, payment success/fail, budget alerts, key health, rotation, weekly digest |
| Pro plan waitlist | Live | "Invite Only" $9.99/mo — notify me button, stored in Resend audience |
| Notification preferences | Live | Per-user email toggle prefs stored in `profiles.notification_prefs` JSONB |
| Promo codes / discounts | Live | Admin API for management |
| Access passes | Live | 15/30-day trial extensions |
| Enterprise tier | Placeholder | "Coming soon" with email notify |
| Team management | Not Started | Multi-user, roles |
| Slack/Discord alerts | Not Started | External notification channels |
| API proxy (real-time) | Not Started | Per-request cost tracking |
| Monthly PDF reports | Stubbed | Code exists but not implemented |

### Provider Sync Support

| Provider | Key Validation | Automated Cost Sync | Notes |
|----------|---------------|-------------------|-------|
| OpenAI | Yes | Yes | Full sync via `/v1/organization/costs` |
| Anthropic | Yes | Yes | Full sync via usage report API |
| DeepSeek | Yes | Partial | Balance-based (not per-model) |
| ElevenLabs | Yes | Yes | Character-based usage |
| OpenRouter | Yes | Partial | Aggregate credit usage |
| Gemini | Yes | No | Google has no billing API |
| Grok (xAI) | Yes | No | Needs Management API key |
| Azure OpenAI | Yes | No | Needs Azure Cost Management |
| Moonshot | Yes | No | No public usage API |

### Key Metrics to Track (via PostHog)
- Signup → Onboarding completion rate
- Keys added per user
- Time to first budget alert
- Subscription conversion (trial → paid)
- Feature usage (estimator, reports, budgets)
- Churn reasons (cancellation flow)

---

## 11. Database Schema

### Core Tables

```
profiles          — User profile (name, company, timezone, currency, notification_prefs JSONB)
projects          — Project groupings for keys
api_keys          — Encrypted API keys with health metadata
project_keys      — Join table: key ↔ project
usage_records     — Synced usage data (per key, per day, per model)
budgets           — Spending limits with alert thresholds
alerts            — Notification feed (budget, health, rotation)
platforms         — Provider reference data
price_snapshots   — Per-model pricing (input/output per MTok)
subscriptions     — Dodo subscription state
access_passes     — Trial extension passes
access_pass_redemptions — Pass usage tracking
webhook_events    — Idempotency for webhooks
audit_log         — Action audit trail
```

### Row-Level Security (RLS)
- Every table has RLS enabled
- Users can only SELECT/UPDATE/DELETE their own rows (`auth.uid() = user_id`)
- Service role (admin client) bypasses RLS for cron jobs and webhooks
- INSERT on sensitive tables (audit_log, notifications) restricted to service role

---

## 12. API Reference

### Server Actions (called from React components)

| Action | File | Purpose |
|--------|------|---------|
| `loginWithEmail` | `lib/actions/auth.ts` | Email/password login (rate-limited) |
| `signupWithEmail` | `lib/actions/auth.ts` | Registration (rate-limited) |
| `signOut` | `lib/actions/auth.ts` | Logout + redirect |
| `resetPassword` | `lib/actions/auth.ts` | Password reset email |
| `listKeys` / `getKey` | `lib/actions/keys.ts` | Read API keys |
| `addKey` | `lib/actions/keys.ts` | Validate + encrypt + store key |
| `updateKey` / `deleteKey` | `lib/actions/keys.ts` | Modify/remove keys |
| `refreshKeyStatus` | `lib/actions/keys.ts` | Re-validate key + sync test |
| `getDashboardData` | `lib/actions/dashboard.ts` | Dashboard aggregates |
| `listProjects` / `createProject` | `lib/actions/projects.ts` | Project CRUD |
| `listBudgets` / `createBudget` | `lib/actions/budgets.ts` | Budget CRUD |
| `listAlerts` / `markAlertRead` | `lib/actions/alerts.ts` | Alert management |
| `getSubscription` | `lib/actions/subscription.ts` | Current subscription |
| `cancelSubscription` | `lib/actions/subscription.ts` | Cancel via Dodo |

### HTTP API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/subscription/create` | User session | Create Dodo checkout |
| POST | `/api/webhooks/dodo` | Webhook signature | Process payment events |
| GET | `/api/health` | None | System health check |
| GET | `/api/platforms` | User session | List active providers |
| POST | `/api/platforms/detect` | User session | Auto-detect key provider |
| GET | `/api/cron/sync-and-check` | CRON_SECRET | Sync usage (every 6h) + check budgets |
| GET | `/api/cron/daily-tasks` | CRON_SECRET | Waste detection + rotation reminders (7AM UTC) |
| GET | `/api/cron/key-health-check` | CRON_SECRET | Key health alerts + emails (6AM UTC daily) |
| GET | `/api/cron/weekly-report` | CRON_SECRET | Weekly usage digest email (Mon 8AM UTC) |
| GET/POST/DELETE | `/api/admin/discounts` | CRON_SECRET | Discount management |
| GET/PATCH | `/api/admin/passes` | CRON_SECRET | Access pass management |

---

## 13. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Auth** | Supabase Auth (JWT tokens, refresh via middleware) |
| **Data Isolation** | Row-Level Security on all tables |
| **API Key Storage** | AES-256-GCM envelope encryption (per-key DEK) |
| **Input Validation** | Zod schemas on all user inputs |
| **CSRF** | Origin header validation on mutation endpoints |
| **Rate Limiting** | Upstash Redis sliding window (auth: 10/min, api: 100/min) |
| **Redirect Safety** | `getSafeRedirect()` blocks open redirects |
| **Headers** | HSTS, X-Frame-Options: DENY, CSP, Referrer-Policy |
| **Secrets** | Environment variables only (never in code) |
| **Webhook Verification** | Standard Webhooks (signature + timestamp) |
| **Idempotency** | `webhook_events` table prevents duplicate processing |
| **Private IP Blocking** | Endpoint URL validation rejects localhost, 10.x, 192.168.x, .local |

---

## 14. Testing Strategy

### Current Tests (8 files, Vitest)
| Test File | What It Tests |
|-----------|--------------|
| `tests/encryption.test.ts` | AES-256-GCM encrypt/decrypt (14 cases) |
| `tests/csrf.test.ts` | CSRF origin validation |
| `tests/rate-limit.test.ts` | Rate limiter behavior |
| `tests/safe-redirect.test.ts` | Redirect safety |
| `tests/budget-validation.test.ts` | Budget schema validation |
| `tests/key-validation.test.ts` | Key validation schemas |
| `tests/key-health.test.ts` | Key health status logic (new) |
| `tests/provider-adapters.test.ts` | Provider adapter tests (new) |

### Running Tests
```bash
pnpm test          # Run all tests once
pnpm test:watch    # Watch mode
pnpm test:e2e      # Playwright (once written)
```

### What Needs More Tests
- E2E: Signup → onboarding → add key → see dashboard
- E2E: Subscription checkout flow
- Integration: Sync engine with mocked provider APIs
- Unit: All server actions (especially `addKey`, `refreshKeyStatus`)

---

## 15. Environment Setup

### Required Environment Variables
```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Security (REQUIRED)
ENCRYPTION_KEY=<64 hex chars>     # Generate: openssl rand -hex 32
CRON_SECRET=<min 32 chars>        # Generate: openssl rand -hex 16

# App URL (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dodo Payments (REQUIRED for billing)
DODO_API_KEY=<your-dodo-key>
DODO_WEBHOOK_SECRET=<webhook-secret>
# Per-region product IDs — create one monthly + one annual product per region in Dodo dashboard
DODO_PRODUCT_MONTHLY_IN=<india-monthly-product-id>
DODO_PRODUCT_ANNUAL_IN=<india-annual-product-id>
DODO_PRODUCT_MONTHLY_US=<us-monthly-product-id>
DODO_PRODUCT_ANNUAL_US=<us-annual-product-id>
DODO_PRODUCT_MONTHLY_CA=<canada-monthly-product-id>
DODO_PRODUCT_ANNUAL_CA=<canada-annual-product-id>
DODO_PRODUCT_MONTHLY_EU=<eu-monthly-product-id>
DODO_PRODUCT_ANNUAL_EU=<eu-annual-product-id>
DODO_PRODUCT_MONTHLY_ROW=<row-monthly-product-id>
DODO_PRODUCT_ANNUAL_ROW=<row-annual-product-id>

# Email — Resend (OPTIONAL for dev, REQUIRED for prod email features)
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=API Lens <noreply@apilens.tech>
RESEND_PRO_WAITLIST_ID=<resend-audience-id>   # For Pro plan waitlist

# Rate Limiting (OPTIONAL — falls back to memory)
UPSTASH_REDIS_REST_URL=<upstash-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-token>
```

### Quick Start
```bash
git clone https://github.com/abinaya661/api-lens.git  # update to your fork/org as needed
cd api-lens
pnpm install
cp .env.example .env.local   # Fill in values
pnpm dev                      # → http://localhost:3000
```

---

## 16. Deployment

### Vercel (Production)
1. Push to `main` branch → auto-deploys via Vercel
2. Set all env vars in Vercel dashboard
3. Cron jobs configured in `vercel.json` (4 total):
   - `sync-and-check`: every 6 hours UTC
   - `daily-tasks`: daily 07:00 UTC
   - `key-health-check`: daily 06:00 UTC
   - `weekly-report`: Mondays 08:00 UTC

### Pre-Production Checklist
- [ ] Supabase: Run all migrations (`supabase db push`)
- [ ] Supabase: Verify RLS policies are active
- [ ] Dodo: Create per-region monthly + annual products (IN, US, CA, EU, ROW) and set all 10 `DODO_PRODUCT_*` env vars
- [ ] Dodo: Set up webhook URL pointing to `/api/webhooks/dodo`
- [ ] Dodo: Switch from test_mode to live
- [ ] Vercel: Set all env vars (especially `ENCRYPTION_KEY`, `CRON_SECRET`)
- [ ] Verify `/api/health` returns `status: healthy`
- [ ] Smoke test: signup → add key → dashboard loads → subscription checkout

---

*Last updated: March 26, 2026 (v1.2). For the latest code, always refer to the repository.*
