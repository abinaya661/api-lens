# API Lens — Quick Reference

## The app
Name: API Lens | Price: ₹415/month (~$4.99 USD) | ₹4,149/year | 7-day trial
Payment: Razorpay INR | Display: USD | Team: Solo + 1-2 collaborators

## Stack
Next.js 15 · TypeScript strict · Tailwind v4 · shadcn/ui New York zinc
Supabase · Razorpay · Resend · Recharts · TanStack Query v5
React Hook Form + Zod · Zustand · Framer Motion · Lucide React
Fonts: Syne (UI) + JetBrains Mono (keys/numbers)

## Colors
#09111f bg · #0c1a2e card · #060d18 sidebar · #1e3a5f border
#4f46e5 brand · #10b981 success · #ef4444 danger · #f59e0b warning

## 8 Platforms
OpenAI · Anthropic · Google Gemini · AWS Bedrock
Azure OpenAI · Mistral AI · Cohere · Custom

## Two modes
/dashboard = global (all keys + all platforms combined)
/projects/[id] = per-project (independent budgets + alerts)

## Files and where they go
PRD.md                          → read for product context
CLAUDE_PROJECT_INSTRUCTIONS.md → paste into Claude Project instructions
CLAUDE.md                       → drop in repo root (Claude Code reads this)
PLATFORMS.md                    → drop in repo root (API integration details)
PROJECT_STRUCTURE.md            → drop in repo root (folder reference)
BUILD_SESSIONS.md               → 15 copy-paste prompts for Claude Code
SCHEMA.md                       → run in Supabase SQL Editor
.env.example                    → copy to .env.local, fill all values

## Skills folder — expert code patterns
skills/SKILLS_INDEX.md          → read first — maps sessions to skill files
skills/SKILL_01_ARCHITECTURE.md → FSA — Next.js, TypeScript, Server Actions
skills/SKILL_02_DATABASE.md     → DBE — PostgreSQL, queries, RLS, indexes
skills/SKILL_03_SECURITY.md     → SEC — AES-256-GCM encryption, auth, env validation
skills/SKILL_04_FRONTEND.md     → FEX — components, skeletons, empty states, layout
skills/SKILL_05_PAYMENTS.md     → PAY — Razorpay plans, webhooks, subscription states
skills/SKILL_06_DEVOPS.md       → DVO — Vercel config, cron jobs, scale
skills/SKILL_07_AI_PLATFORMS.md → AIX — platform APIs, cost calculation, format utils

## Build order
1 Auth · 2 Key CRUD · 3 OpenAI Data · 4 Dashboard · 5 Projects
6 Budgets+Alerts · 7 Estimator · 8 All Platforms · 9 Custom
10 Razorpay · 11 Advanced Alerts · 12 Settings · 13 Landing Page
14 Polish · 15 Launch

## Security rules
- AES-256-GCM on every stored key
- Never show full key (show last 4 only: sk-...4f8b)
- Decrypt only immediately before platform API call
- RLS on every Supabase table
- Razorpay webhook HMAC-SHA256 verified
- Zod validates all env vars at startup

## Alert types
budget_50/75/90/100 · spike (3× daily avg) · waste (30d inactive)
rotation (90d key age) · price_change · outage

## How to start a session with Claude Code
cd your-project-folder
claude
(paste the prompt from BUILD_SESSIONS.md for that session)
(check skills/SKILLS_INDEX.md to know which skill files to read)
