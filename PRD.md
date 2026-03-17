# API Lens — Product Requirements Document
# Version: 1.0 Final — v1 only. No v2 or v3 content.

**App Name:** API Lens
**Tagline:** See exactly what your APIs are costing you
**Type:** Web SaaS — mobile after traction
**Payment:** Razorpay (INR billing) — display USD throughout app
**Price:** ₹415/month (~$4.99 USD) | ₹4,149/year (~$49.99 USD)
**Trial:** 7 days free, card required upfront
**Team:** Solo founder + 1–2 collaborators

---

## 1. The Problem

Anyone building with AI APIs faces three painful problems every single day:

**Problem 1 — Keys everywhere**
A developer building a product might have 3 OpenAI keys (dev, staging, prod), 2 Anthropic keys, a Gemini key, and an AWS Bedrock key. That is 7 keys across 4 different dashboards. There is no single place to see all of them, their status, or their combined spend.

**Problem 2 — Surprise bills**
AI platforms bill monthly. A developer might be spending $300/month without realising it until the invoice arrives. By then it is too late. There are no warnings, no alerts, no way to know you are heading for an overspend until it has already happened.

**Problem 3 — No project attribution**
A team running 3 client projects and 2 internal tools has no way to know which project is costing what. All the spend shows up in one combined bill. They cannot tell clients what their AI usage actually cost, cannot set limits per project, and cannot identify which project is burning money.

---

## 2. The Solution

API Lens is a single dashboard that solves all three problems:

- Add all your API keys from all platforms in one place
- Usage and cost data pulled automatically from each platform every 15 minutes — no manual entry
- Set budgets and get alerted before you overspend — not after
- Attribute costs to projects and clients separately
- Estimate future costs before you commit to building something
- Get automated monthly reports

---

## 3. Target Users

**Primary users:**
- Solo developers building AI-powered products
- Small startups (2–20 people) using multiple AI APIs
- Agencies managing AI API costs for multiple clients
- Freelancers billing clients for AI API usage

**What they have in common:**
- Using 2 or more AI API platforms simultaneously
- Spending $50–$2,000/month on AI APIs
- No visibility into their spending until the bill arrives
- No way to attribute costs to specific projects or clients

---

## 4. Supported Platforms at Launch — All 14

All 14 platforms auto-sync from day one. No manual logging. No custom platforms.

| Platform | Sync Delay | Unit Measured | Adapter |
|---|---|---|---|
| OpenAI | 5 minutes | Tokens | Pattern 2 |
| Anthropic | Real-time | Tokens | Pattern 2 |
| Mistral AI | 1 hour | Tokens | Pattern 2 |
| Cohere | Daily | Tokens | Pattern 2 |
| OpenRouter | Daily | Tokens (credit diff) | Pattern 1 |
| Google Gemini | 3 hours | Tokens | Pattern 4 |
| Google Vertex AI | 24–48 hours | Tokens | Pattern 4 |
| Azure OpenAI | 1 hour | Tokens | Pattern 4 |
| AWS Bedrock | Daily | Tokens + exact cost | Pattern 4 |
| ElevenLabs | Real-time | Characters | Pattern 3 |
| Deepgram | Real-time | Minutes | Pattern 3 |
| AssemblyAI | Real-time | Minutes | Pattern 3 |
| Replicate | Real-time | Compute seconds | Pattern 3 |
| Fal AI | Real-time | Images | Pattern 3 |

**Adapter patterns:**
- Pattern 1: OpenAI-compatible REST (OpenRouter only in v1)
- Pattern 2: Per-token custom format (OpenAI, Anthropic, Mistral, Cohere)
- Pattern 3: Per-unit non-token (ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal)
- Pattern 4: Cloud billing API (Gemini, Vertex AI, Azure OpenAI, AWS Bedrock)

**Note on sync delays:** The delay figures are the platform providers' own data publication delays — not API Lens delays. API Lens syncs every 15 minutes. If a provider only publishes data daily, the displayed data will be up to that provider's delay old. This is shown clearly in the UI with a "last synced" timestamp and a delay badge on affected keys.

---

## 5. Core Features

### 5.1 Global Dashboard `/dashboard`
The home screen. Shows everything combined across all keys and all platforms.

**KPI cards:**
- Total spend MTD (month to date)
- Projected spend by end of month (linear extrapolation)
- Budget remaining (% and dollar amount)
- Number of active keys

**Charts and tables:**
- Daily spend chart for last 30 days — gap-filled so missing days show $0, not gaps
- Spend breakdown by platform (bar chart, colourblind-safe colours)
- Top 5 most expensive keys this month
- Key health grid — active / invalid / rotation due / inactive

**Other:**
- Last 5 alerts panel
- "Last synced X minutes ago" timestamp on every data section

### 5.2 Project Tracker `/projects` and `/projects/[id]`
Separate cost view per project. Users create named projects and assign keys to them.

Example: A freelancer creates "Client A — Chatbot", "Client B — Search", "Internal Tool". Each project has its own spend, budget, and alerts — fully independent from global.

**Per-project view shows:**
- Project spend MTD
- Projected month-end cost
- Budget vs actual progress bar
- All keys assigned to this project with their individual costs
- Daily spend chart for this project only
- Project-specific alerts
- "Last synced X minutes ago"

**Extra project features:**
- Compare 2 or 3 projects side by side
- Set project budget separate from global budget
- Project-level alerts independent of global alerts
- Coloured project labels (12-colour picker)

### 5.3 API Key Management `/keys` and `/keys/[id]`
Add, label, organise, and monitor all API keys in one place.

**Add key flow:**
- Two-column dialog: form on left, intelligence panel on right
- User pastes key → auto-detect platform (debounced 300ms, POST /api/platforms/detect)
  - High confidence → auto-select provider, green border on input
  - Medium confidence → yellow border, "Looks like X — confirm?" message
  - Low confidence → no auto-select, user chooses manually
- User selects provider → intelligence panel loads for that provider
- Nickname field (required)
- Extra fields shown conditionally:
  - Azure OpenAI: endpoint URL
  - Gemini / Vertex AI: GCP Project ID
  - AWS Bedrock: AWS region
- Encryption badge above save button: "End-to-end encrypted with AES-256-GCM the moment you save. Nobody — including us — can ever see your full key again."
- On save: 2-second encryption animation (characters scramble → asterisks → ✓), then dialog closes

**Key Intelligence Panel (right column):**
- What this key does (plain English description)
- Where to get it (step-by-step instructions + direct link button)
- Typical monthly spend range (e.g. $20–$200/month)
- Capability badges: chat / embeddings / images / audio / video
- Sync delay badge if delay > 60 minutes
- Special warning in yellow box if applicable (e.g. OpenAI admin key requirement)
- Duplicate warning if user already has a key from this provider

**Key management:**
- Keys stored encrypted (AES-256-GCM) — plaintext never persists
- Display shows only last 4 characters (e.g. sk-...4f8b)
- Assign key to one or more projects
- Per-key budget with thresholds at 50%, 75%, 90%, 100%
- Key rotation reminder every 90 days (alert at 80 days)
- Waste detector — flagged after 30 days of zero activity
- Status badge per key: active / invalid / rotation due / inactive
- "Last synced X minutes ago" per key

### 5.4 Cost Estimator `/estimator`
Plan costs before building anything. No API keys required to use this feature.

**Inputs:**
- Platform + model selection
- Messages per day
- Average tokens per message
- Number of users

**Outputs:**
- Projected monthly cost (calculated instantly, no API call)
- Cross-platform comparison table — same inputs, all 14 platforms, ranked cheapest to most expensive
- Model swap suggestion: "Switching from GPT-4o to Claude Haiku saves you $47/month"
- Batch discount toggle — shows savings when using batch API (where available)

**Save and track:**
- Save estimate and link it to a project
- Actual vs estimate tracker — once real usage data arrives, compare your estimate to reality

### 5.5 Budget Management `/budgets`
Set spending limits at every level independently.

**Budget scopes:**
- Global — entire account
- Per platform — e.g. max $100/month on OpenAI
- Per project — e.g. max $50/month on Client A
- Per key — e.g. max $30/month on this specific key

**Alert thresholds per budget:** 50% / 75% / 90% / 100%

All budget comparisons use `cost_usd` — this works identically for all 14 platforms regardless of their native unit type (tokens, characters, minutes, etc.).

### 5.6 Alerts `/alerts`
Proactive warnings before things go wrong.

**Alert types:**
| Type | Trigger |
|---|---|
| budget_50 | Budget 50% reached |
| budget_75 | Budget 75% reached |
| budget_90 | Budget 90% reached |
| budget_100 | Budget 100% reached |
| spike | Daily spend 3× the 7-day rolling average |
| waste | Key has zero activity for 30+ days |
| rotation | Key is 80+ days old |
| price_change | Provider updated their pricing |
| key_invalid | Authentication failed on sync |
| sync_failed | 3+ consecutive sync failures for a key |

**Delivery:** In-app notification badge (unread count in sidebar) + email via Resend

### 5.7 Reports `/reports`
Monthly report generated automatically on the 1st of every month.

**Contents:**
- Total spend vs last month (delta + %)
- Biggest platform this month
- Biggest project this month
- Biggest single key this month
- Cost savings opportunities identified
- Month-by-month spend trend (last 6 months)
- Shareable link (unique token per report)

**Delivery:** Email via Resend on the 1st + viewable in-app

### 5.8 Settings
- `/settings/profile` — name, avatar, timezone, role, company name
- `/settings/security` — change password, connected OAuth providers, active sessions
- `/settings/notifications` — email preferences per alert type
- `/settings/billing` — subscription plan, payment history, upgrade/cancel
- `/settings/team` — "Coming soon" placeholder only (v2 feature)

### 5.9 Onboarding `/onboarding`
3-step wizard shown once to new users after signup. Each step is skippable.

**Step 1 — Role selection:**
- Cards: Solo Developer, Startup/Team, Agency/Freelancer, Enterprise, Other
- Agency + Enterprise + Other reveal a company name text input
- Data stored in: profiles.role and profiles.company_name
- Company name displayed in sidebar below API Lens logo

**Step 2 — Project setup:**
- Project name field (required to proceed, or skip)
- 12-colour picker for project colour
- Creates first project if name entered

**Step 3 — Add first API key:**
- Inline add-key form (not a modal)
- If project was created in step 2: auto-assigned to that project
- Pro tip shown: "Create a separate key per project in your provider dashboard for clean cost tracking. Example: OpenAI key 1 → Client chatbot, OpenAI key 2 → Internal search"
- Skip available

**On completion:** `profiles.onboarded = true` → redirect to `/dashboard`

**Middleware logic:**
- Unauthenticated → `/login`
- Authenticated, onboarded=false → `/onboarding`
- Authenticated, onboarded=true → allow through to requested page

---

## 6. What is NOT in v1

The following are explicitly excluded. Do not build, reference, or hint at these:

- Mobile app (Flutter or otherwise)
- Team roles and permissions (`/settings/team` is a "coming soon" placeholder only)
- Slack / Discord / webhook integrations
- Browser extension
- Referral system
- Developer REST API
- Audit logs
- White-label for agencies
- Multi-currency display (USD only in app, INR only in Razorpay)
- Custom platforms or manual cost logging
- Real-time sub-15-minute tracking
- Per-user or per-feature cost breakdown
- Cloudflare Workers proxy
- AI cost optimizer
- Multi-provider failover routing

---

## 7. User Flows

### New user onboarding (target: under 2 minutes to first value)
1. Land on marketing page at `/`
2. Click "Start 7-Day Free Trial"
3. Sign up — email (with verification) or Google OAuth
4. Complete 3-step onboarding wizard
5. Land on `/dashboard`
6. Add first real API key — validation + encryption animation
7. First real cost data appears within ≤15 minutes (next sync cycle)

### Daily usage flow (target: under 2 minutes)
1. Open app → dashboard loads with skeleton screens immediately
2. Check total spend MTD vs budget
3. Click into a project for project-level view
4. Review any new alerts (badge in sidebar)
5. Done

### Alert flow
1. `sync-and-check` cron runs, detects threshold crossed or spike
2. Alert row inserted into `alerts` table
3. Email queued to Resend
4. In-app badge count increments
5. User clicks alert → navigated to relevant key or project

---

## 8. Design System

**Fonts:** Syne (all UI text) + JetBrains Mono (keys, numbers, code)
**Default mode:** Dark. Both dark and light fully implemented via next-themes.
**Number formatting:** All numbers use `tabular-nums` CSS class for alignment.

**Colour tokens:**
```
--bg-base:        #09111f    Background
--bg-card:        #0c1a2e    Cards, panels
--bg-sidebar:     #060d18    Sidebar
--bg-elevated:    #0f2040    Modals, dropdowns
--border:         #1e3a5f    Standard borders
--border-subtle:  #152a45    Subtle dividers
--brand:          #4f46e5    Primary actions
--brand-hover:    #4338ca    Hover state
--success:        #10b981    Positive states
--danger:         #ef4444    Errors, destructive
--warning:        #f59e0b    Warnings
--text-primary:   #e2e8f0    Main text
--text-secondary: #94a3b8    Supporting text
--text-muted:     #4a6380    Muted / placeholder
```

**Chart colours (colourblind-safe, use in this order):**
1. Blue: #3b82f6
2. Orange: #f97316
3. Purple: #8b5cf6
4. Teal: #14b8a6
5. Yellow: #eab308
6. Pink: #ec4899

**Design principles:**
- Every page loads with skeleton screens — no blank states
- Every empty state has an icon, title, description, and one clear action
- Every screen has one primary action
- WCAG 2.1 AA accessibility minimum

---

## 9. Technical Architecture

**Frontend:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui New York zinc
**Backend:** Supabase (PostgreSQL + Row Level Security + Auth)
**Payments:** Razorpay (INR, hosted checkout only)
**Email:** Resend + React Email templates
**Error tracking:** Sentry
**Hosting:** Vercel free plan

**Cron jobs — exactly 2:**
```
/api/cron/sync-and-check  — every 15 minutes
/api/cron/daily-tasks     — daily at 7am UTC
```

**Cost tracking rule (non-negotiable):**
`cost_usd` is calculated at sync time and stored in `usage_records`.
All queries sum `cost_usd` directly. No cost calculations at query time.
No conditional logic based on `unit_type` in any query or chart.
This ensures budgets, alerts, and all charts work identically for all 14 platforms.

---

## 10. Pricing

| Plan | Price | Billing |
|---|---|---|
| Free Trial | 7 days | Card required upfront via Razorpay |
| Monthly | ₹415/month (~$4.99 USD) | Monthly via Razorpay |
| Annual | ₹4,149/year (~$49.99 USD) | Annual via Razorpay — saves 2 months |

All 14 platforms included. All features included. One flat price. No tiers.

**Razorpay paise amounts:**
- Monthly: 41,500 paise = ₹415.00
- Annual: 4,14,900 paise = ₹4,149.00

---

## 11. Data Policies

**Retention:** `usage_records` kept for 12 months, then archived (not deleted).
**Encryption:** AES-256-GCM on all stored API keys. Plaintext never written to database.
**Masking:** Last 4 characters only shown in UI after initial save. Full key never retrievable by user.
**PII:** Email, name, avatar URL, timezone, role only. No card data — Razorpay hosted checkout handles all payment data.
**Logs:** No plaintext API keys in server logs, error logs, or Sentry events. Never.

---

## 12. Success Metrics

**Primary:**
- Time to first value: target < 2 minutes (signup → first real cost data visible)
- Trial-to-paid conversion: target 20%+
- Monthly churn: target < 5%
- DAU/MAU ratio: target 25%+ (sticky daily habit)

**Targets:**
- Week 1 post-launch: 50 signups, 10 paying users
- Month 1: 200 signups, 40 paying users, ₹16,600 MRR
- Month 3: 500 paying users, ₹2,07,500 MRR
- Month 6: 1,000 paying users, ₹4,15,000 MRR

---

## 13. Launch Plan

**Phase 1 — Build (Sessions 1–15):** Complete web app
**Phase 2 — Beta (2 weeks):** 10–20 beta users, fix issues, collect testimonials
**Phase 3 — Public launch:** Reddit (r/SideProject, r/webdev, r/artificial), Hacker News Show HN, Product Hunt
**Phase 4 — Growth:** Content marketing, developer communities
**Phase 5 — Mobile:** Flutter Android app after 200+ paying users confirmed
