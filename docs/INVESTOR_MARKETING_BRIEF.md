# API Lens — Product & Investment Brief

**Version:** 1.0 | **Date:** March 25, 2026 | **Classification:** External — Investors & Marketing

---

## Executive Summary

**API Lens** is a SaaS platform that gives businesses a single dashboard to **monitor, manage, and optimize their AI API spending** across every major provider — OpenAI, Anthropic, Google Gemini, and more.

As AI adoption accelerates, companies are running multiple AI models from multiple providers simultaneously. The result: fragmented billing, invisible cost overruns, and zero visibility into which models deliver the best ROI. **API Lens solves this** — it's the financial control plane for AI infrastructure.

---

## The Problem

| Pain Point | Impact |
|-----------|--------|
| **Fragmented billing** | Teams use 3-5+ AI providers, each with separate billing dashboards, different units, different billing cycles |
| **No cost visibility** | Engineering ships features using AI APIs but nobody tracks the actual cost per feature, per model, or per team |
| **Budget overruns** | A single misconfigured API call loop can burn thousands of dollars in minutes with zero alerting |
| **Key sprawl** | API keys are shared in Slack, stored in plaintext, never rotated — a security liability |
| **No forecasting** | Teams can't predict next month's AI spend because they don't even know this month's |

### Market Context
- The AI API market is projected to exceed **$50B+ by 2028**
- Average enterprise uses **4.2 AI providers** simultaneously (and growing)
- **73% of engineering teams** report "no formal process" for tracking AI API costs
- API key breaches cost companies an average of **$180K per incident**

---

## The Solution

API Lens provides:

### 1. Unified Cost Dashboard
One view across all providers. See total spend, per-provider breakdown, daily trends, and month-end projections — updated automatically.

### 2. Smart Budget Alerts
Set budgets at any level (global, per-provider, per-project, per-key) and get alerts at 50%, 75%, 90%, and 100% thresholds before overruns happen.

### 3. Secure Key Management
API keys are stored with **AES-256-GCM encryption** (the same standard used by banks). Health monitoring auto-detects broken or revoked keys. Rotation reminders ensure keys don't go stale.

### 4. Cost Estimator
Before committing to a model, compare pricing across all providers. Input your expected volume, see projected monthly costs — make data-driven model selection decisions.

### 5. Project-Level Tracking
Organize keys by project or team. See which project is driving costs, which is underutilizing its allocation, and where to optimize.

### 6. Automated Reports
CSV exports, date-filtered reports, and trend analysis — give finance and engineering the numbers they need without manual spreadsheet work.

---

## Supported AI Providers

| Provider | Logo | What It Powers | Sync Type |
|----------|------|---------------|-----------|
| **OpenAI** | GPT-4, GPT-4o, DALL-E | Full automated cost sync |
| **Anthropic** | Claude 3, Claude 4 | Full automated cost sync |
| **Google Gemini** | Gemini Pro, Gemini Ultra | Key validation (billing API unavailable) |
| **xAI (Grok)** | Grok-2, Grok-3 | Key validation |
| **DeepSeek** | DeepSeek V3, R1 | Balance-based sync |
| **ElevenLabs** | Voice AI, TTS | Character-based usage sync |
| **OpenRouter** | Multi-model router | Credit-based sync |
| **Azure OpenAI** | Enterprise GPT deployments | Key validation |
| **Moonshot AI** | Kimi models | Key validation |

*More providers on the roadmap: AWS Bedrock, Cohere, Mistral, Replicate*

---

## Product Screenshots & Key Screens

### Dashboard
- Total spend this month with trend arrows
- Projected month-end spend
- Active API keys count
- Budget utilization percentage
- Daily cost chart (30-day view)
- Provider breakdown with percentage bars

### API Key Management
- Table view of all keys across providers
- Health indicators (Healthy / Warning / Inactive / Revoked)
- One-click key validation and status refresh
- Masked key display for security

### Budget Configuration
- Global, per-provider, per-project, or per-key budgets
- 4-tier alert thresholds (50%, 75%, 90%, 100%)
- Progress bars showing current utilization

### Cost Estimator
- Input: messages/day or token counts
- Output: Monthly cost comparison across every provider and model
- Sort by cheapest or most capable

### Onboarding
- 3-step wizard: Welcome → Add your first key → Set a budget
- Takes under 2 minutes to go from signup to first dashboard view

---

## Business Model

### Pricing Tiers

| | **Monthly** | **Annual** |
|---|---|---|
| **Price** | Regional pricing (e.g., $29/mo USD) | Regional pricing (discounted ~20%) |
| **Trial** | 7-day free trial | 7-day free trial |
| **Features** | All features included | All features included |

### Regional Pricing
Prices automatically adjust based on user location — supporting **50+ countries** with local currencies (USD, EUR, GBP, INR, CAD, and more). Powered by Dodo Payments as Merchant of Record, handling global tax compliance.

### Planned: Enterprise Tier
- SSO / SAML integration
- Team management with role-based access
- Priority support + SLA
- Custom alert integrations (Slack, PagerDuty, webhooks)
- Audit log access
- Volume pricing

---

## Technology & Architecture

### Why This Matters to Investors

| Aspect | Detail | Why It Matters |
|--------|--------|---------------|
| **Modern Stack** | Next.js 15, TypeScript, Supabase, Vercel | Fast iteration, low infra cost, scales automatically |
| **Security-First** | AES-256-GCM encryption, RLS, CSRF, CSP headers | Handles sensitive credentials — security is table stakes |
| **Adapter Pattern** | Pluggable provider integrations | Adding a new AI provider takes days, not months |
| **Global Payments** | Dodo Payments (MoR) | No tax/compliance headaches in 50+ countries |
| **Automated Testing** | CI/CD pipeline with lint, type-check, build, test | Ship fast without breaking things |
| **Edge-Ready** | Vercel Edge deployment, geo-detection | Sub-100ms responses globally |

### Infrastructure Costs (Lean Operation)
| Service | Estimated Monthly Cost |
|---------|----------------------|
| Vercel (hosting) | $0–20 (Pro plan) |
| Supabase (DB + Auth) | $25 (Pro plan) |
| Upstash Redis | $0–10 (pay-per-use) |
| Resend (email) | $0–20 |
| Sentry (errors) | Free tier |
| PostHog (analytics) | Free tier |
| **Total** | **~$50-75/month** |

This means the platform is **profitable from the first paying customer**.

---

## Traction & Current Status

### What's Built (Production-Ready)
- Complete user authentication (email + Google OAuth)
- 9 AI provider integrations with encrypted key storage
- Real-time spending dashboard with charts and projections
- 4-tier budget alert system
- Project organization and key grouping
- Cost estimator with model comparison
- Reports with CSV export
- Subscription billing with regional pricing (50+ countries)
- Promo code and access pass system
- Automated usage sync via cron jobs
- Comprehensive security audit (21 vulnerabilities fixed, 64 test cases)
- CI/CD pipeline (GitHub Actions → Vercel)

### What's Next (Launch Roadmap)

```
NOW (Week 1-2)          NEXT (Week 3-6)           LATER (Month 2-4)
─────────────           ──────────────            ─────────────────
Production deploy       Team management           Enterprise SSO
Smoke testing           Monthly PDF reports       Public API
Dodo live mode          More sync providers       Slack/Discord alerts
                        Email alert templates     Usage forecasting
                        Performance tuning        White-label option
```

---

## Competitive Landscape

| Competitor | What They Do | How API Lens Differs |
|-----------|-------------|---------------------|
| **Helicone** | OpenAI proxy + logging | API Lens is provider-agnostic (9+ providers), no proxy needed for basic tracking |
| **LangSmith** | LLM observability (LangChain ecosystem) | API Lens focuses on cost/billing, not trace debugging. Simpler to adopt. |
| **Portkey** | AI gateway + observability | API Lens is simpler, focused on cost control. No code changes needed. |
| **Spreadsheets** | Manual tracking | API Lens automates everything — no manual data entry |

### Key Differentiators
1. **No code changes required** — Just add your API keys, no proxy setup, no SDK integration
2. **Multi-provider from day one** — Not locked to one AI provider's ecosystem
3. **Budget alerts before overruns** — Proactive cost control, not reactive reporting
4. **Bank-grade security** — AES-256-GCM encryption for stored keys
5. **Global-ready** — Regional pricing in 50+ countries from launch

---

## Target Audience

### Primary: Engineering Teams (10-200 people)
- Using multiple AI providers
- No centralized cost tracking
- Engineering managers asking "how much are we spending on AI?"

### Secondary: AI-First Startups
- Burning through API credits during development
- Need to forecast AI costs for fundraising/budgeting
- Want to compare model costs before committing

### Tertiary: Enterprises
- Compliance requirements for API key management
- Need audit trails and role-based access
- Multiple teams using AI independently

---

## Key Metrics & KPIs

### Product Metrics
| Metric | Target | How We Measure |
|--------|--------|---------------|
| Signup → Dashboard (onboarding completion) | >70% | PostHog funnel |
| Keys added per user (first week) | >2 | Database query |
| Trial → Paid conversion | >15% | Dodo analytics |
| Monthly churn | <5% | Subscription data |
| NPS | >50 | In-app survey |

### Revenue Metrics
| Metric | Target (Month 6) |
|--------|-----------------|
| MRR | $5K+ |
| Paying customers | 100+ |
| Average Revenue Per User (ARPU) | $35-50/mo |
| LTV:CAC ratio | >3:1 |

---

## Go-To-Market Strategy

### Phase 1: Developer Community (Weeks 1-8)
- Launch on Product Hunt, Hacker News, Reddit r/programming
- Write content: "How We Cut Our AI API Bill by 40%"
- Partner with AI newsletter authors for mentions
- Free tier / extended trials for early adopters

### Phase 2: Content-Led Growth (Months 2-4)
- SEO: "AI API cost management", "OpenAI billing dashboard", "compare AI model pricing"
- Blog series: Provider-specific guides (cost optimization tips per provider)
- Cost calculator as free tool (drives organic traffic)
- Integration partners: dev tool marketplaces

### Phase 3: Enterprise Sales (Months 4-8)
- Enterprise tier with SSO, audit logs, SLA
- Direct outreach to AI-heavy companies
- Partnership with cloud providers (AWS/GCP/Azure marketplaces)
- Case studies from Phase 1 customers

---

## Team & Contact

- **Repository:** github.com/abinaya661/api-lens
- **Stack:** Next.js 15 + Supabase + Dodo Payments + Vercel
- **Stage:** Pre-launch (production build complete, final testing)

---

## Appendix: Feature Detail Matrix

| Category | Feature | Status | Description |
|----------|---------|--------|-------------|
| **Auth** | Email signup | Live | With email verification |
| **Auth** | Google OAuth | Live | One-click social login |
| **Auth** | Password reset | Live | Email-based reset flow |
| **Onboarding** | 3-step wizard | Live | Provider select → Add key → Set budget |
| **Keys** | Add/edit/delete | Live | Encrypted storage, health monitoring |
| **Keys** | Auto-detection | Live | Detects provider from key format |
| **Keys** | Health check | Live | Validates key against provider API |
| **Keys** | Rotation reminders | Live | Alerts for keys >80 days old |
| **Dashboard** | Spend overview | Live | Monthly total, projected, trend |
| **Dashboard** | Provider breakdown | Live | Percentage bars per provider |
| **Dashboard** | Daily chart | Live | 30-day area chart |
| **Budgets** | 4-scope budgets | Live | Global/provider/project/key |
| **Budgets** | Threshold alerts | Live | 50/75/90/100% notifications |
| **Alerts** | In-app feed | Live | Read/unread, severity badges |
| **Alerts** | Waste detection | Live | Flags unused keys (30+ days) |
| **Reports** | Date filtering | Live | Custom date ranges |
| **Reports** | CSV export | Live | Download usage data |
| **Estimator** | Model comparison | Live | All providers, sort by cost |
| **Billing** | Subscription plans | Live | Monthly + Annual |
| **Billing** | Regional pricing | Live | 50+ countries |
| **Billing** | Promo codes | Live | Admin-managed discounts |
| **Billing** | Access passes | Live | Trial extensions |
| **Security** | AES-256-GCM | Live | Envelope encryption |
| **Security** | RLS | Live | Row-level data isolation |
| **Security** | Rate limiting | Live | Redis + memory fallback |
| **Projects** | CRUD | Live | Organize keys by project |
| **Settings** | Profile/prefs | Live | Name, company, timezone, currency |
| **Sync** | Automated cron | Live | Daily usage fetch |
| **Enterprise** | SSO | Planned | SAML/OIDC integration |
| **Enterprise** | Team management | Planned | Invite, roles, permissions |
| **Enterprise** | Slack alerts | Planned | Webhook integrations |
| **Enterprise** | Audit logs | Planned | Compliance-ready |
| **API** | Public REST API | Planned | Programmatic access |
| **Reports** | Monthly PDF | Planned | Automated email reports |

---

*This document was prepared on March 25, 2026. For questions, contact the API Lens team.*
