# API Lens - Product & Investment Brief

**Version:** 2.1 | **Date:** March 28, 2026 | **Classification:** External - Investors & Marketing

---

## Executive Summary

**API Lens** is the financial control plane for AI infrastructure - a SaaS dashboard that gives businesses unified visibility into their AI API spending across every major provider (OpenAI, Anthropic, Google Gemini, and more). As companies run multiple AI models simultaneously, they face fragmented billing, invisible cost overruns, and zero spending visibility. API Lens solves this with automated cost tracking, proactive budget alerts, bank-grade key security, and a smarter estimator for both model comparison and spend forecasting.

---

## The Problem

| Pain Point | Impact |
|-----------|--------|
| **Fragmented billing** | Teams use 3-5+ AI providers, each with separate dashboards, different units, different billing cycles |
| **No cost visibility** | Nobody tracks the actual cost per feature, per model, or per team |
| **Budget overruns** | A single misconfigured API call loop can burn thousands of dollars in minutes with zero alerting |
| **Key sprawl** | API keys shared in Slack, stored in plaintext, never rotated - a security liability |
| **No forecasting** | Teams can't predict next month's AI spend because they don't even know this month's |

### Market Context
- AI API market projected to exceed **$50B+ by 2028**
- Average enterprise uses **4.2 AI providers** simultaneously (and growing)
- **73% of engineering teams** report "no formal process" for tracking AI API costs
- API key breaches cost companies an average of **$180K per incident**

---

## The Solution

| Feature | Description |
|---------|-------------|
| **Unified Cost Dashboard** | Single view across all providers - total spend, per-provider breakdown, daily trends, month-end projections |
| **Smart Budget Alerts** | Set budgets at any level (global, provider, project, key) with 4-tier alerts (50/75/90/100%) before overruns happen |
| **Secure Key Management** | AES-256-GCM encrypted storage, health monitoring, auto-detection of provider from key format, waste detection (flags unused keys 30+ days), rotation reminders |
| **Smart Estimator** | Compare model pricing across categories (text, reasoning, code, image, audio, video, embeddings) and forecast month-end spend from real usage patterns |
| **Project-Level Tracking** | Organize keys by project/team - see which project drives costs and where to optimize |
| **Automated Reports** | CSV exports, date-filtered reports, trend analysis - no manual spreadsheet work |

---

## Supported AI Providers

| Provider | Sync Type |
|----------|-----------|
| **OpenAI** (GPT-4, GPT-4o, GPT-5 family, DALL-E) | Full automated cost sync |
| **Anthropic** (Claude 3, Claude 4) | Full automated cost sync |
| **Google Gemini** (Flash, Pro, Imagen, Veo) | Key validation (billing API unavailable) |
| **xAI / Grok** (Grok-2, Grok-4) | Key validation |
| **DeepSeek** (V3, R1) | Balance-based sync |
| **ElevenLabs** (Voice AI, TTS) | Character-based usage sync |
| **OpenRouter** (Multi-model router) | Credit-based sync |
| **Azure OpenAI** (Enterprise GPT) | Key validation |
| **Moonshot AI** (Kimi models) | Key validation |

*Roadmap: AWS Bedrock, Cohere, Mistral, Replicate*

---

## Business Model

### Pricing
| | **Monthly** | **Annual** |
|---|---|---|
| **Base Plan** | Regional pricing (e.g., $4.99/mo USD) | ~20% discount (e.g., $49.99/yr USD) |
| **Trial** | 7-day free trial | 7-day free trial |
| **Features** | All core features included | All core features included |

Regional pricing auto-adjusts based on user location - **50+ countries** with local currencies (USD, EUR, GBP, INR, CAD, etc.). Powered by Dodo Payments as Merchant of Record, handling global tax compliance.

### Planned: Enterprise Tier
- SSO / SAML integration, team management with role-based access
- Priority support + SLA, audit log access
- Custom alert integrations (Slack, PagerDuty, webhooks), volume pricing

---

## Technology & Architecture

| Aspect | Detail |
|--------|--------|
| **Modern Stack** | Next.js 15, TypeScript, Supabase, Vercel - fast iteration, low infra cost, auto-scaling |
| **Security-First** | AES-256-GCM encryption, RLS, CSRF, CSP headers, rate limiting |
| **Adapter Pattern** | Pluggable provider integrations - adding a new AI provider takes days, not months |
| **Pricing Intelligence** | Centralized model catalog with category-aware pricing, batch/cache math, and refresh automation |
| **Global Payments** | Dodo Payments (MoR) - no tax/compliance headaches in 50+ countries |
| **CI/CD** | GitHub Actions pipeline with lint, type-check, build, test |
| **Edge-Ready** | Vercel deployment, geo-detection - fast responses globally |

### Infrastructure Costs (Lean Operation)
| Service | Estimated Monthly Cost |
|---------|----------------------|
| Vercel (hosting) | $0-20 |
| Supabase (DB + Auth) | $25 |
| Upstash Redis | $0-10 |
| Resend (email) | $0-20 |
| Sentry + PostHog | Free tier |
| **Total** | **~$50-75/month** |

**Profitable from the first paying customer.**

---

## Traction & Current Status

### What's Built (Launch-Ready Product)
- Complete authentication (email + Google OAuth + password reset) with 7-day free trial
- 9 AI provider integrations with AES-256-GCM encrypted key storage and health monitoring
- Real-time spending dashboard with charts, projections, and provider breakdown
- Budget alert system (4 tiers), waste detection (unused keys), rotation reminders
- Project organization, reports with CSV export, and a Smart Estimator for model comparison plus usage-based month-end forecasting
- Subscription billing with regional pricing (50+ countries), promo codes, access passes
- Pricing catalog operations with refresh automation for estimator accuracy
- Full email system (11 transactional templates), rate limiting, comprehensive security audit (21 fixes, 64 tests)
- SEO-optimized blog (5 articles, JSON-LD structured data, dynamic sitemap), dark/light theme toggle

### What's Next
```
NOW (Week 1-2)          NEXT (Week 3-6)           LATER (Month 2-4)
-------------           --------------            -----------------
Production rollout      Team management           Enterprise SSO
Smoke testing           Monthly PDF reports       Public API
Dodo live mode          More sync providers       Slack/Discord alerts
Pricing ops hardening   Performance tuning        White-label option
```

---

## Competitive Landscape

| Competitor | What They Do | How API Lens Differs |
|-----------|-------------|---------------------|
| **Helicone** | OpenAI proxy + logging | Provider-agnostic (9+ providers), no proxy needed |
| **LangSmith** | LLM observability (LangChain) | Focuses on cost/billing, not trace debugging. Simpler to adopt. |
| **Portkey** | AI gateway + observability | Simpler, focused on cost control. No code changes needed. |
| **Spreadsheets** | Manual tracking | Automates everything - no manual data entry |

### Key Differentiators
1. **No code changes required** - Just add API keys, no proxy/SDK integration
2. **Multi-provider from day one** - Not locked to one ecosystem
3. **Budget alerts before overruns** - Proactive cost control, not reactive reporting
4. **Bank-grade security** - AES-256-GCM encryption for stored keys
5. **Smarter planning** - Compare models and forecast spend before bills arrive
6. **Global-ready** - Regional pricing in 50+ countries from launch

---

## Target Audience

| Segment | Description |
|---------|-------------|
| **Primary: Engineering Teams (10-200)** | Using multiple AI providers with no centralized cost tracking; managers asking "how much are we spending on AI?" |
| **Secondary: AI-First Startups** | Burning through API credits during development; need to forecast AI costs for fundraising/budgeting |
| **Tertiary: Enterprises** | Compliance requirements for API key management; need audit trails, role-based access across multiple teams |

---

## Key Metrics & KPIs

| Metric | Target | How We Measure |
|--------|--------|---------------|
| Onboarding completion | >70% | PostHog funnel |
| Keys added per user (week 1) | >2 | Database query |
| Trial -> Paid conversion | >15% | Dodo analytics |
| Monthly churn | <5% | Subscription data |
| MRR (Month 6) | $5K+ | Dodo analytics |
| Paying customers (Month 6) | 100+ | Database |
| ARPU | $35-50/mo | Revenue / customers |
| LTV:CAC ratio | >3:1 | Calculated |

---

## Go-To-Market Strategy

### Phase 1: Developer Community (Weeks 1-8)
- Launch on Product Hunt, Hacker News, Reddit r/programming
- Content: "How We Cut Our AI API Bill by 40%" - partner with AI newsletter authors
- Extended trials for early adopters

### Phase 2: Content-Led Growth (Months 2-4)
- SEO targeting "AI API cost management", "OpenAI billing dashboard", "compare AI model pricing"
- Blog series with provider-specific optimization guides
- Free cost calculator tool for organic traffic

### Phase 3: Enterprise Sales (Months 4-8)
- Enterprise tier with SSO, audit logs, SLA
- Direct outreach to AI-heavy companies; case studies from Phase 1 customers
- Cloud provider marketplace listings (AWS/GCP/Azure)

---

## Team & Contact

- **Repository:** github.com/abinaya661/api-lens
- **Stack:** Next.js 15 + Supabase + Dodo Payments + Vercel
- **Stage:** Launch-ready product, final production rollout underway

---

*Prepared March 28, 2026. For questions, contact the API Lens team.*
