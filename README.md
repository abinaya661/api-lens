<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

<h1 align="center">🔍 API Lens</h1>

<p align="center">
  <strong>One dashboard to monitor, budget, and attribute AI API costs across all providers.</strong>
</p>

<p align="center">
  Stop guessing where your AI spend is going.<br/>
  API Lens connects to OpenAI, Anthropic, Google Gemini, AWS Bedrock, Mistral, Cohere, Azure OpenAI — and even custom platforms — giving you a single pane of glass for every dollar spent.
</p>

---

## ✨ Features

### 📊 Global Dashboard
Real-time visibility into total spend, projected month-end costs, budget remaining, and daily trends — across every provider and project in one view.

### 🗂️ Project-Based Cost Attribution
Organize API keys into projects. Costs roll up automatically: **Key → Project → Company**. Compare projects side-by-side.

### 🔑 Secure API Key Management
Envelope encryption (AES-256-GCM + Supabase Vault). Keys are masked after entry. Health badges, rotation reminders, and waste detection for inactive keys.

### 💰 Multi-Level Budgets & Alerts
Set budgets at 4 levels — **Global · Platform · Project · Key** — with threshold alerts at 50%, 75%, 90%, and 100%. Spike detection flags anomalies automatically.

### 🔄 Automatic Sync Engine
Hourly syncs via Trigger.dev cron jobs. Manual refresh available. 3-retry exponential backoff. Handles invalid keys, rate limits, and missing pricing gracefully.

### 🧮 Cost Estimator (Free, No Signup)
Pick any platform + model, enter your expected usage, and get a cross-platform comparison table ranking all providers cheapest to most expensive — with model swap suggestions.

### 🌗 Dark & Light Mode
Seamless theme switching for every environment. Toggle between premium dark and light modes via the navigation bar.

### 📑 High-Tech Blog
Expert guides on AI cost management, API governance, and scaling intelligence infrastructure, delivered in a high-tech glassmorphism interface.

### 📧 Reports & Sharing
Monthly auto-reports on the 1st. Shareable read-only links for clients. PDF and CSV export.

---

## 🏗️ Supported Platforms

| Platform | Auth Method | Sync Delay |
|---|---|---|
| OpenAI | Admin API key | ~5 min |
| Anthropic | Admin API key | ~5 min |
| Google Gemini | Service Account JSON | ~15 min |
| AWS Bedrock | IAM credentials | ~24 hr |
| Mistral AI | Standard API key | ~5 min |
| Cohere | Standard API key | ~5 min |
| Azure OpenAI | Azure AD + endpoint URL | ~12 hr |
| Custom | Manual weekly entry | Manual |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Database & Auth** | Supabase (PostgreSQL, RLS, Auth, Vault) |
| **Background Jobs** | Trigger.dev v4 |
| **Payments** | Razorpay |
| **Email** | Resend |
| **Hosting** | Vercel |
| **Error Tracking** | Sentry |
| **Analytics** | PostHog |
| **Rate Limiting** | Upstash Redis |
| **Package Manager** | pnpm |

---

## 📁 Project Structure

```
api-lens/
├── app/                    # Next.js App Router pages & layouts
│   ├── (auth)/             # Auth pages (login, signup, forgot-password)
│   ├── (dashboard)/        # Authenticated app pages
│   │   ├── dashboard/      # Global dashboard
│   │   ├── projects/       # Project management & detail views
│   │   ├── keys/           # API key management
│   │   ├── budgets/        # Budget configuration
│   │   ├── alerts/         # Alert feed
│   │   ├── reports/        # Reports & exports
│   │   ├── estimator/      # Cost estimator
│   │   └── settings/       # Account & billing settings
│   ├── api/                # API route handlers
│   └── auth/               # Auth callback routes
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── charts/             # Recharts chart components
│   ├── forms/              # Form components (API key wizard, etc.)
│   └── layout/             # Sidebar, header, nav components
├── lib/                    # Core business logic
│   ├── encryption/         # Envelope encryption service
│   ├── supabase/           # Supabase client (browser, server, admin)
│   ├── providers/          # Per-platform API integration modules
│   ├── pricing/            # Pricing engine
│   └── utils/              # Shared utilities
├── types/                  # Shared TypeScript types & DB schema
├── trigger/                # Trigger.dev job definitions
├── supabase/               # Supabase migrations & seed data
└── public/                 # Static assets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Supabase account & project
- Razorpay test account

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/api-lens.git
cd api-lens

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase, Razorpay, Resend, and other credentials

# Run database migrations
pnpm supabase db push

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 💳 Pricing

| Plan | Price | Details |
|---|---|---|
| **Free Trial** | $0 for 7 days | All features, credit card required |
| **Monthly** | $5.99/mo | Cancel anytime |
| **Annual** | $59.99/yr | Save 2 months |

---

## 🔒 Security

- **Envelope encryption** for all API keys (AES-256-GCM + Supabase Vault master key)
- **Row Level Security** on every Supabase table
- **Rate limiting** via Upstash Redis (100 req/min API, 10 req/min auth)
- **CORS** restricted to API Lens domain only
- **CSP headers** on all pages
- **Brute-force protection** with exponential delay
- **Audit logging** — every key operation recorded (append-only)

---

## 📄 License

Proprietary — All rights reserved.
