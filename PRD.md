# API Lens — Product Requirements Document

**Version:** 1.0 Final
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
A developer building a product might have 3 OpenAI keys (dev, staging, prod), 2 Anthropic keys, a Gemini key, and an AWS Bedrock key. That is 7 keys across 4 different dashboards. There is no single place to see all of them, their status, or their spend.

**Problem 2 — Surprise bills**
API platforms bill monthly. A developer might be spending $300/month without realising it until the invoice arrives. By then it is too late. There are no warnings, no alerts, no way to know you are heading for an overspend until it has already happened.

**Problem 3 — No project attribution**
A team running 3 client projects and 2 internal tools has no way to know which project is costing what. All the spend shows up in one combined bill. They cannot tell clients what their AI usage actually cost, cannot set limits per project, and cannot identify which project is burning money.

---

## 2. The Solution

API Lens is a single dashboard that solves all three problems:

- Add all your API keys from all platforms in one place
- See real-time spending pulled directly from each platform's billing API
- Set budgets and get alerted before you overspend — not after
- Attribute costs to projects and clients separately
- Estimate future costs before you commit to building something
- Get weekly and monthly reports automatically

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

## 4. Supported Platforms at Launch

All 8 platforms supported from day one:

| Platform | Usage API | Notes |
|----------|-----------|-------|
| OpenAI | Yes | Requires Admin Key |
| Anthropic Claude | Yes | Requires Admin Key |
| Google Gemini | Yes | Requires Service Account |
| AWS Bedrock | Yes | Requires IAM credentials |
| Azure OpenAI | Yes | Requires endpoint URL |
| Mistral AI | Yes | Standard API key |
| Cohere | Yes | Standard API key |
| Custom | Manual entry | User-defined platform |

---

## 5. Core Features

### 5.1 Global Dashboard
The home screen. Shows everything combined across all keys and all platforms.

What it shows:
- Total spend this month across all platforms
- Projected spend by end of month
- Budget remaining (% and dollar amount)
- Number of active keys
- Daily spend chart for last 30 days
- Spend breakdown by platform (bar chart)
- Top 5 most expensive keys
- Key health status (active / invalid / expiring / inactive)
- Last 5 alerts

### 5.2 Project Tracker
Separate from global. Users create named projects and assign keys to them.

Example: A freelancer creates "Client A — Chatbot", "Client B — Search", "Internal Tool". Each project shows its own spend, its own budget, its own alerts — completely independent from global.

What it shows per project:
- Project total spend this month
- Projected month-end cost
- Budget vs actual progress bar
- All keys assigned to this project and their individual costs
- Daily spend chart for this project only
- Project-specific alerts

Extra features:
- Compare 2 or 3 projects side by side
- Set project budget separate from global budget
- Project-level alerts independent of global alerts

### 5.3 API Key Management
Add, label, organise, and monitor all API keys in one place.

Features:
- Add keys from all 8 platforms
- Keys stored encrypted (AES-256-GCM) — never stored as plain text
- Display shows only last 4 characters (e.g. sk-...4f8b)
- Assign keys to one or more projects
- Per-key budget with alert thresholds at 50%, 75%, 90%, 100%
- Key rotation reminder every 90 days
- Waste detector — flags keys with zero activity in 30+ days
- Key health status badge per key

### 5.4 Cost Estimator
Plan costs before building anything. Zero keys required to use this.

How it works:
- User picks platform and model
- Enters: messages per day, average tokens per message, number of users
- App instantly shows projected monthly cost
- Cross-platform comparison table — same inputs, all 8 platforms, ranked cheapest to most expensive
- Model swap suggestion — "Switching from GPT-4o to Claude Haiku saves you $47/month"
- Batch discount toggle — shows savings if using batch API
- Save estimate and link it to a project
- Later compare the estimate to what actually happened

### 5.5 Budget Management
Set limits at every level independently.

Budget levels:
- Global (entire account)
- Per platform (e.g. max $100/month on OpenAI)
- Per project (e.g. max $50/month on Client A)
- Per key (e.g. max $30/month on this specific key)

Alert thresholds per budget: 50% / 75% / 90% / 100%

### 5.6 Alerts
Get warned before things go wrong — not after.

Alert types:
- Budget threshold reached (50/75/90/100%)
- Spend spike — daily spend is 3× higher than normal
- Key inactive — no activity in 30+ days (you may be paying for nothing)
- Key rotation due — key is 80+ days old
- Platform pricing changed — provider updated their prices
- Provider outage — live status from provider status pages

Delivery: in-app notification + email via Resend

### 5.7 Reports
Automatic monthly report emailed on the 1st of every month:
- Total spend vs last month
- Biggest platform, biggest project, biggest key
- Cost savings opportunities identified
- Shareable link or PDF for clients

### 5.8 Additional Features
- Demo mode — new users see realistic fake data, no key needed to explore
- Keyboard shortcuts — ⌘K command palette, ⌘N new key, ⌘P new project
- Provider status feed — live outage banner when any connected platform has an incident
- Cost per 1,000 API calls — normalised efficiency metric per key
- Estimated vs actual tracker — see if your pre-build estimates were accurate

---

## 6. What is NOT in v1 (comes after launch)

- Mobile app (Flutter)
- Team roles and permissions
- Slack / Discord / webhook integrations
- Browser extension
- Referral system
- Developer REST API
- Audit logs
- White-label for agencies
- Multi-currency display

---

## 7. User Flows

### New user onboarding (target: under 2 minutes to first value)
1. User lands on marketing page
2. Clicks "Start Free Trial"
3. Signs up with email or Google
4. Sees demo dashboard with realistic fake data immediately (no blank screen)
5. Prompted to add first real API key
6. Adds key — app validates it, shows first real cost data
7. Prompted to set a budget
8. Onboarding complete — user has seen value

### Daily usage flow
1. User opens app — sees global dashboard
2. Checks total spend vs budget
3. Clicks into a project to see project-level costs
4. Reviews any new alerts
5. Done in under 2 minutes

### Alert flow
1. Usage sync detects threshold crossed
2. Alert created in database
3. Email sent via Resend
4. In-app notification badge appears
5. User clicks alert — taken directly to the relevant key or project

---

## 8. Design Principles

**Fast** — every page loads with skeleton screens instantly. No blank pages.
**Simple** — every screen has one primary action. Users are never confused about what to do.
**Trustworthy** — security is visible. Users can see their keys are masked. Encryption is explained.
**Consistent** — same colors, same fonts, same layout patterns on every screen.
**Mobile-friendly** — works on phone even though it is web-first.

---

## 9. Technical Architecture

**Frontend:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui
**Backend:** Supabase (PostgreSQL database + authentication + storage)
**Payments:** Razorpay (INR billing, USD display)
**Email:** Resend
**Hosting:** Vercel (auto-scales to handle 1,00,000+ users)
**Security:** AES-256-GCM encryption on all stored keys, RLS on every database table

**Why this handles scale:**
- Vercel auto-scales with zero configuration
- Supabase PostgreSQL with indexes handles millions of rows
- Database queries optimised with proper indexes from day one
- No single point of failure
- Free tier handles 50,000 monthly active users — upgrade only when profitable

---

## 10. Pricing

| Plan | Price | Billing |
|------|-------|---------|
| Free Trial | 7 days | Card required upfront |
| Monthly | ₹415/month (~$4.99 USD) | Monthly via Razorpay |
| Annual | ₹4,149/year (~$49.99 USD) | Annual via Razorpay, saves 2 months |

All features included in one flat price. No feature tiers.

**Revenue projections:**
- 100 paying users = ₹41,500/month (~$499) — costs ~₹1,000/month to run
- 500 paying users = ₹2,07,500/month (~$2,495) — costs ~₹3,000/month to run
- 1,000 paying users = ₹4,15,000/month (~$4,990) — costs ~₹5,000/month to run

---

## 11. Success Metrics

**Week 1 after launch:** 50 signups, 10 paying users
**Month 1:** 200 signups, 40 paying users, ₹16,600 MRR
**Month 3:** 500 paying users, ₹2,07,500 MRR
**Month 6:** 1,000 paying users, ₹4,15,000 MRR

**Key metrics to track from day 1:**
- Time to first value (target: under 2 minutes)
- Trial to paid conversion (target: 20%+)
- Monthly churn (target: under 5%)
- Daily active users / Monthly active users ratio (target: 25%+)

---

## 12. Launch Plan

**Phase 1 — Build (Sessions 1–15):** Build complete web app
**Phase 2 — Beta (2 weeks):** 10–20 beta users, fix issues, collect testimonials
**Phase 3 — Launch:** Post on Reddit (r/SideProject, r/webdev, r/artificial), Hacker News Show HN, Product Hunt
**Phase 4 — Growth:** Content marketing, developer community engagement, word of mouth
**Phase 5 — Mobile:** Build Flutter Android app once 200+ paying users confirmed
