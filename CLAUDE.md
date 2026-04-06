# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit (strict mode)
pnpm test             # Vitest unit tests (run once)
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright end-to-end tests
pnpm db:push          # Push migrations to Supabase
pnpm db:reset         # Reset local Supabase DB
pnpm db:generate-types  # Regenerate types/supabase.ts from local DB
```

Package manager is **pnpm** only. Never use npm or yarn.

## Architecture

API Lens is a Next.js 15 App Router SaaS for monitoring AI API costs across 9 providers. Stack: TypeScript (strict), Tailwind CSS v4, shadcn/ui, Supabase (auth + Postgres + RLS), Dodo Payments, Resend email, Upstash Redis rate limiting, Vercel deployment.

### Route Groups

- `app/(auth)/` — login, signup, forgot-password, reset-password, verify-email
- `app/(dashboard)/` — all authenticated pages (dashboard, keys, projects, budgets, alerts, estimator, reports, settings, subscription, onboarding)
- `app/api/cron/` — 5 Vercel cron jobs (sync-and-check, daily-tasks, key-health-check, weekly-report, price-update), protected by `CRON_SECRET` bearer token
- `app/api/admin/` — admin endpoints (discounts, passes, pricing), also protected by `CRON_SECRET`
- `app/api/webhooks/dodo/` — Dodo payment webhooks, verified with `standardwebhooks`

### Key Patterns

**Three Supabase clients** with distinct security contexts:
- `lib/supabase/server.ts` — SSR/server actions, respects RLS
- `lib/supabase/client.ts` — browser client, respects RLS
- `lib/supabase/admin.ts` — service-role, bypasses RLS. Used for writes after permission is verified via the user client.

**Server actions** (`lib/actions/*.ts`) follow a standard flow:
1. Create server client, authenticate user/company via `_helpers.ts`
2. Check rate limit, validate input with Zod (`lib/validations/`)
3. Read with user client (RLS permission check), write with admin client
4. Log audit via `lib/utils/audit.ts`
5. Return `{ data, error }` (never throw to client)

**Envelope encryption** for API keys: AES-256-GCM with per-credential DEK wrapped by master key (`ENCRYPTION_KEY`). Stored as JSONB in `encrypted_credentials` column.

**Dodo Payments client** (`lib/dodo/client.ts`) uses a Proxy for lazy initialization to avoid build errors when env vars are missing.

**Platform adapters** (`lib/platforms/adapters/*.ts`) implement `validateKey`, `fetchUsage`, and `getCapabilities()`. Each adapter declares a `ProviderCapabilities` object (defined in `lib/platforms/types.ts`) indicating what it can do: key validation, usage sync, cost tracking, managed key discovery, per-model/per-key breakdown, and admin key requirements. The `BaseAdapter` provides a conservative default. Registry at `lib/platforms/registry.ts`. Sync engine at `lib/platforms/sync-engine.ts` orchestrates cron-based usage sync, skips `validation_only` keys automatically, and tracks key health. The `usage_capability` column on `api_keys` (`full` | `aggregate` | `validation_only`) is derived from adapter capabilities at key-add time.

**Rate limiting** (`lib/ratelimit/`) uses Upstash Redis with in-memory fallback. Three tiers: API (100/min), auth (10/min), sync (1/min).

### State Management

- Server state: TanStack Query v5 (`hooks/use-*.ts`)
- Local state: Zustand
- Forms: React Hook Form + Zod

### Database

Supabase Postgres with RLS on all tables. Migrations in `supabase/migrations/` (001-012). Auth trigger auto-creates profile, company, and trial subscription on signup. Core ownership chain: `auth.users` -> `companies` -> `projects`/`api_keys`/`budgets`. Migration 012 added `usage_capability` column and expanded the `provider_type` enum with `grok`, `moonshot`, `deepseek`, `elevenlabs`, `openrouter`.

### Change Map

| Area | Key files (in order) |
|---|---|
| API key CRUD | `supabase/migrations/` -> `types/database.ts` -> `lib/validations/key.ts` -> `lib/actions/keys.ts` -> `hooks/use-keys.ts` -> `app/(dashboard)/keys/page.tsx` |
| Projects/budgets/alerts | `lib/validations/*.ts` -> `lib/actions/*.ts` -> `hooks/use-*.ts` -> `app/(dashboard)/*/page.tsx` |
| Add a provider | `lib/platforms/adapters/{provider}.ts` (implement `validateKey`, `fetchUsage`, `getCapabilities()`) -> `lib/platforms/registry.ts` -> `types/providers.ts` -> `lib/validations/key.ts` (prefix check if needed) |
| Pricing catalog | `lib/pricing/index.ts` -> `app/api/admin/pricing/route.ts` -> `app/api/cron/price-update/route.ts` |
| Subscription/billing | `app/api/subscription/create/route.ts` -> `app/api/webhooks/dodo/route.ts` -> `lib/actions/subscription.ts` |
| Sync/cron | `lib/platforms/sync-engine.ts` -> `app/api/cron/*/route.ts` -> `vercel.json` |
| Env vars | `lib/env.ts` -> `.env.example` |

### Important Notes

- `trigger/` directory exists but is NOT used in production. Cron jobs run via Vercel Cron.
- Dodo Payments replaced Razorpay. Never reference or use Razorpay.
- Cron routes use `maxDuration: 120` and `runtime: 'nodejs'`.
- Webhook handler instantiates `new Webhook(secret)` inside the handler function, not at module scope.
- ESLint: unused vars prefixed with `_` are allowed.
