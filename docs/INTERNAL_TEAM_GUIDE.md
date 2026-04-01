# API Lens - Internal Team Guide

**Version:** 2.2 | **Date:** March 28, 2026 | **Classification:** Internal - Engineering & Product

> **Companion doc:** For code-level details (tech stack, folder structure, DB schema, server actions, hooks, API routes, patterns, env vars, security architecture), see **AGENTS.md** in the repo root.

---

## 1. What Is API Lens?

API Lens is a **SaaS dashboard for monitoring, managing, and optimizing AI API spending** across multiple providers (OpenAI, Anthropic, Google Gemini, etc.). It aggregates usage data, sets budget alerts, and helps teams optimize costs from a single dashboard.

**Current ownership model:** API Lens uses a **company-owned workspace model** for runtime data and billing. Today that still maps to **one user per company**, so there is no multi-user/team membership layer yet, but keys, projects, budgets, alerts, subscriptions, and forecasts all belong to the company record rather than directly to `auth.users`.

**Key User Flows:**
1. Sign up -> Onboarding wizard -> Add API keys -> See spending dashboard
2. Set budgets -> Receive alerts at 50/75/90/100% thresholds
3. Use the Smart Estimator to compare model pricing and forecast month-end spend
4. View reports, export CSV, track trends over time

---

## 2. Architecture Overview

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 15)                     |
|  Landing Page | Auth Pages | Dashboard | Settings | Onboarding   |
|  React Query (state) | shadcn/ui | Tailwind CSS | Recharts       |
+-------------------------+----------------------------------------+
                          | Server Actions + API Routes
+-------------------------v----------------------------------------+
|                        BACKEND (Next.js API)                     |
|  Server Actions (lib/actions/) | API Routes (app/api/)           |
|  Zod Validation | Rate Limiting | CSRF Protection                |
+------+------+--------------+---------------+--------------------+
       |      |              |               |
+------v--+ +-v--------+ +---v------+ +------v-----+
| Supabase | | Provider | |  Dodo    | | Upstash    |
| (Auth+DB)| | Adapters | | Payments | | Redis      |
| + RLS    | | (9 APIs) | | (Billing)| | (Rate Lim) |
+----------+ +----------+ +----------+ +------------+
       |
+------v-----------------------------------------------------------+
|  Vercel Cron (5 jobs):                                           |
|  sync-and-check (every 6h) | daily-tasks (7AM UTC)               |
|  key-health-check (6AM UTC) | weekly-report (Mon 8AM UTC)        |
|  price-update (1st + 15th, 9AM UTC)                              |
|  Syncs usage from providers -> Upserts to usage_records          |
|  Checks budgets -> Creates alerts -> Sends emails                |
|  Refreshes estimator pricing -> Sends summary email              |
+------------------------------------------------------------------+
```

> **Tech Stack, Folder Structure:** See AGENTS.md S1, S2

---

## 3. Completed Work

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| **0 - Foundation** | Scaffolding | Next.js 15 + TS strict, Supabase (auth + DB + RLS), AES-256-GCM encryption, middleware (auth redirect, security headers, geo-detection), CI/CD pipeline |
| **1 - Core Features** | Product | Email/Google auth, onboarding wizard, API key CRUD + 9 provider adapters, dashboard (charts, spend overview, projections), projects, budgets (4-tier alerts), alert feed, reports + CSV, estimator foundation, settings |
| **2 - Automation** | Sync | Cron-based usage sync, key health monitoring (auto-deactivate after 5 failures), daily tasks (waste detection 30+ days, rotation reminders 80+ days), budget threshold checking, rate limiting (Redis + memory fallback) |
| **3 - Payments** | Billing | Dodo Payments (replaced Razorpay), monthly + annual plans with 7-day trial, per-region checkout (IN/US/CA/EU/ROW), webhook handler + idempotency, regional pricing (50+ countries), promo codes, access passes, Pro plan waitlist |
| **4 - Security** | Hardening | Security audit (21 fixes, 64 tests), CSRF protection, safe redirects, CSP headers, Zod + private IP blocking, webhook race condition fix, landing page (glass-morphism, marquee, pricing) |
| **5 - Enterprise** | Tier | Enterprise "Coming Soon" tier with email notification + regional pricing display |
| **6 - Email** | Comms | Resend integration: welcome, payment success/fail, renewal, budget alerts, key health, rotation reminders, weekly digest, trial expiration, Pro waitlist (Resend audience), branded templates |
| **7 - Blog/SEO** | Growth | MDX blog pipeline, blog index + post pages (glassmorphism), JSON-LD structured data, dynamic sitemap, 5 SEO/GEO-optimized posts, nav updates (Insights, Pricing link) |
| **8 - Bug Fixes** | Polish | Schema field name fixes (sync engine, crons), alert insert fixes, weekly-report cron fix, webhook_events table (migration 007), notification_prefs (migration 008), middleware public routes fix, blog deps, pricing corrections, 5 cron jobs in vercel.json |
| **9 - Final UI & Email** | Polish | Blog redesign (glassmorphism index + post pages), email templates modernized (all 11 transactional, centered logos), dark/light theme toggle (`next-themes`), SEO optimization ("api key manager" meta + JSON-LD), welcome email simplified (clean warm message), pro waitlist confirmation email added, sidebar restructured to collapsible nav groups (Projects + Settings), preferences split to own page (`settings/preferences`) |
| **10 - Smart Estimator & Pricing Intelligence** | Expansion | Compare + forecast estimator tabs, weighted moving average forecasting, expanded `price_snapshots` catalog (categories, batch/cache/image/unit pricing, deprecation flags), admin pricing API, bi-weekly price-update cron, company-scoped subscription/webhook alignment, live schema alignment migration (010) |

---

## 4. What's Pending (Current State)

### Immediate Blockers (Must Do Before Launch)
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Apply live Supabase migrations for estimator rollout: `009_estimator_overhaul` and `010_live_schema_alignment` (`008_notification_prefs` too if the target project never received it) | DevOps | Pending |
| 2 | Create Dodo per-region products -> set all `DODO_PRODUCT_*` env vars (10 vars: IN, US, CA, EU, ROW x monthly/annual) | Product/Backend | Blocked |
| 3 | Set up Dodo webhook endpoint -> set `DODO_WEBHOOK_SECRET` | Backend | Blocked |
| 4 | Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL=API Lens <noreply@apilens.tech>` in Vercel | DevOps | Blocked |
| 5 | End-to-end smoke tests (signup -> checkout -> webhook -> cancel, estimator compare/forecast, pricing admin + cron auth checks) | QA/Backend | Not Started |
| 6 | Production deployment (prod Supabase + Dodo live mode + Vercel prod) | DevOps | Not Started |

### Known Gaps
- **Sync frequency:** Vercel cron runs every 6h. For real-time, need Pro plan or external scheduler.
- **Providers without usage APIs:** Gemini, Grok, Azure OpenAI, Moonshot return validation-only (no automated cost sync).
- **E2E tests:** Playwright config exists but no e2e test files written yet.
- **Price update cron:** Provider parsing is best-effort. Parse failures soft-fail and require manual review or admin pricing updates.
- **Workspace model:** Company ownership is canonical, but there is still exactly one user per company. Team/member support remains future roadmap work.

---

## 5. Roadmap

### Sprint 1: Launch Readiness (1-2 weeks)
| Priority | Task | Team |
|----------|------|------|
| P0 | Apply live Supabase migrations on the production project | DevOps |
| P0 | Complete smoke tests with Dodo test mode and estimator flows | Backend + QA |
| P0 | Production Supabase project setup + env vars | DevOps |
| P0 | Dodo live mode activation + product creation | Backend + Product |
| P0 | Vercel production deployment | DevOps |
| P1 | Write 5-10 Playwright e2e tests (critical flows) | Frontend |
| P1 | Manually trigger `/api/cron/price-update` and verify summary output | Backend |

### Sprint 2: Stability & Monitoring (2-3 weeks)
| Priority | Task | Team |
|----------|------|------|
| P1 | Build monthly report generation (PDF + email) | Backend |
| P1 | Harden provider pricing parsers and add change review workflow | Backend |
| P1 | Price change detection alerts | Backend |
| P2 | Dashboard performance optimization (SSR where possible) | Frontend |
| P2 | Mobile responsive polish | Frontend |
| P2 | Error boundary components for graceful failure | Frontend |

### Sprint 3: Growth Features (4-6 weeks)
| Priority | Task | Team |
|----------|------|------|
| P1 | Team/multi-user support (invite members, roles) | Full Stack |
| P1 | Enterprise tier (SSO, audit logs, SLA) | Full Stack |
| P2 | Slack/Discord/webhook alert integrations | Backend |
| P2 | Custom alert rules (spend spike, anomaly detection) | Backend |
| P3 | Public API for programmatic access | Backend |

### Sprint 4: Scale & Optimize (6-8 weeks)
| Priority | Task | Team |
|----------|------|------|
| P2 | More providers (AWS Bedrock, Cohere, Mistral, Replicate) | Backend |
| P2 | Advanced analytics (model comparison, cost-per-quality) | Full Stack |
| P2 | Forecast scenario planning and confidence-band refinement | Backend |
| P3 | SOC 2 compliance preparation | DevOps + Legal |

---

## 6. For Frontend Developers

### Getting Started
```bash
pnpm install
cp .env.example .env.local  # Fill in Supabase keys at minimum
pnpm dev                     # Starts on localhost:3000 with Turbopack
```

> **Coding patterns, hooks API, component hierarchy:** See AGENTS.md S7 (hooks), S9 (patterns)

### Navigation Structure
- **Desktop:** Collapsible sidebar. Standalone: Dashboard, Reports. Collapsible groups with chevron toggle + auto-expand on child routes; collapses to icon-only (w-16).
  - Projects group: API Keys, Budgets, Alerts, Estimator
  - Settings group: Profile, Preferences, Notifications, Billing & Plan
- **Mobile:** Bottom nav bar (5 items: Home, Projects, Reports, Alerts, Settings)
- **Breakpoint:** Responsive at `lg:` (1024px)

### Key Files
| File | What It Does |
|------|-------------|
| `app/(dashboard)/*/page.tsx` | Dashboard page components |
| `components/dashboard/` | Charts, metric cards, provider breakdown |
| `components/estimator/` | Compare + forecast estimator UI |
| `components/shared/` | Reusable page header, stat cards, skeletons |
| `components/ui/` | shadcn/ui base components |
| `hooks/use-*.ts` | Data fetching hooks |
| `hooks/use-estimator.ts` | Estimator compare + forecast queries |
| `app/globals.css` | Theme variables and custom utilities |

### Common Tasks
- **Add a new dashboard page:** Create `app/(dashboard)/your-page/page.tsx`, add nav item in `components/layout/sidebar.tsx` and `mobile-nav.tsx`
- **Add a new form field:** Update Zod schema in `lib/validations/`, update hook in `hooks/`, update page component
- **New chart:** Use Recharts `<AreaChart>` or `<BarChart>` inside `<ResponsiveContainer>` with dark theme tooltip
- **Estimator UI change:** Update `components/estimator/`, then `hooks/use-estimator.ts` only if the data shape changes

---

## 7. For Backend Developers

> **All backend patterns (encryption flow, adapter pattern, rate limiting, Supabase clients, webhook handling, auth):** See AGENTS.md S9 (patterns), S3 (change map for file paths)

### Key Files
| File | What It Does |
|------|-------------|
| `lib/actions/*.ts` | Server actions (CRUD + business logic) |
| `lib/actions/estimator.ts` | Company/project forecast generation |
| `lib/forecasting/index.ts` | Pure weighted moving average forecasting |
| `lib/platforms/adapters/*.ts` | Provider API integrations |
| `lib/platforms/sync-engine.ts` | Cron sync logic |
| `app/api/*/route.ts` | HTTP API endpoints |
| `app/api/admin/pricing/route.ts` | Manual pricing catalog operations |
| `app/api/cron/price-update/route.ts` | Best-effort provider pricing refresh |
| `lib/encryption/index.ts` | Key encryption/decryption |
| `lib/validations/*.ts` | Zod input schemas |
| `supabase/migrations/` | Database schema |

### Common Tasks
- **Add a new provider:** Create adapter in `lib/platforms/adapters/`, register in `registry.ts`, add to `PROVIDER_CONFIGS` in `types/providers.ts`
- **Add a new API route:** Create `app/api/your-route/route.ts`, export `GET`/`POST`/etc.
- **Add a new server action:** Add function to `lib/actions/*.ts`, create corresponding hook in `hooks/`
- **Modify DB schema:** New migration in `supabase/migrations/`, update `types/database.ts`
- **Update pricing catalog:** Seed baseline data in migration `009_estimator_overhaul`, then use `/api/admin/pricing` or `/api/cron/price-update` for live catalog maintenance

---

## 8. For Product Managers

### Feature Status Summary
**Live (35+ features):** Auth (email + Google + password reset), onboarding wizard, 9 provider integrations (encrypted storage, health monitoring, auto-detection), spending dashboard (charts, projections), budgets (4-tier alerts), alert feed (waste detection, rotation reminders), projects, Smart Estimator (model compare + spend forecasting), reports + CSV, subscription billing (regional pricing, 50+ countries), promo codes, access passes, Pro plan waitlist (with confirmation email), notification preferences, transactional emails (11 types), pricing admin and price-refresh automation, blog/SEO (5 articles, JSON-LD, sitemap), dark/light theme toggle, collapsible sidebar nav groups

**Workspace semantics:** All operational data is company-scoped even though each company currently has one owner user. Global budgets and company forecasts are intentionally company-level constructs.

**Planned:** Team management, Enterprise SSO, Slack/Discord alerts, public API, monthly PDF reports, audit logs

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
- Signup -> Onboarding completion rate, Keys added per user (first week)
- Trial -> Paid conversion, Monthly churn, Feature usage (estimator, reports, budgets)

> **Database Schema, API Reference, Security Architecture:** See AGENTS.md S4, S6-S8, S10

---

## 9. Testing

| Test File | What It Tests |
|-----------|--------------|
| `tests/encryption.test.ts` | AES-256-GCM encrypt/decrypt (14 cases) |
| `tests/csrf.test.ts` | CSRF origin validation |
| `tests/rate-limit.test.ts` | Rate limiter behavior |
| `tests/safe-redirect.test.ts` | Redirect safety |
| `tests/budget-validation.test.ts` | Budget schema validation |
| `tests/key-validation.test.ts` | Key validation schemas |
| `tests/key-health.test.ts` | Key health status logic |
| `tests/provider-adapters.test.ts` | Provider adapter tests |
| `tests/forecasting.test.ts` | Estimator forecast math and month-edge cases |

### What Needs More Tests
- E2E: Signup -> onboarding -> add key -> see dashboard
- E2E: Subscription checkout flow
- Integration: Sync engine with mocked provider APIs
- Integration: Pricing admin + price-update cron auth and update paths
- Unit: All server actions (especially `addKey`, `getCompanyForecast`, `getProjectForecast`)

> **Test commands:** See AGENTS.md S9 (Commands section)

---

## 10. Deployment

### Quick Start
```bash
git clone https://github.com/abinaya661/api-lens.git
cd api-lens && pnpm install
cp .env.example .env.local   # Fill in values
pnpm dev                      # -> http://localhost:3000
```

> **Full env var reference (required vs optional, generation hints):** See AGENTS.md S9

### Pre-Production Checklist
- [ ] Supabase: Run all migrations (`supabase db push`) - 10 migrations total in repo
- [ ] Supabase: For an existing hosted project, verify live apply of `009_estimator_overhaul` and `010_live_schema_alignment` (`008_notification_prefs` too if missing)
- [ ] Supabase: Verify RLS policies are active
- [ ] Dodo: Create per-region monthly + annual products (IN, US, CA, EU, ROW) -> set all 10 `DODO_PRODUCT_*` env vars
- [ ] Dodo: Set up webhook URL pointing to `/api/webhooks/dodo` -> set `DODO_WEBHOOK_SECRET`
- [ ] Dodo: Switch from test mode to live
- [ ] Vercel: Set all env vars (especially `ENCRYPTION_KEY`, `CRON_SECRET`)
- [ ] Verify `/api/health` returns `status: healthy`
- [ ] Verify `/api/cron/price-update` and `/api/admin/pricing` with CRON auth
- [ ] Smoke test: signup -> add key -> dashboard loads -> estimator compare/forecast -> subscription checkout

---

*Last updated: March 28, 2026 (v2.2). For code-level details, see AGENTS.md.*
