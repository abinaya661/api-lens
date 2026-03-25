# Repository Guidelines

## Tech Stack
- **Framework:** Next.js 15 App Router, React 19, TypeScript (strict)
- **Auth + DB:** Supabase (RLS enabled), `@supabase/ssr` for server components
- **Payments:** Dodo Payments (MoR) — `dodopayments` SDK, replaces any Razorpay references
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- **Email:** Resend
- **Analytics:** PostHog, Sentry (`@sentry/nextjs`)
- **UI:** shadcn/ui, Radix UI, Tailwind CSS v4, Recharts, Framer Motion
- **Testing:** Vitest + jsdom (unit), Playwright (e2e)
- **Package manager:** `pnpm` (use pnpm, never npm/yarn)
- **Deploy:** Vercel + Vercel Cron (no Trigger.dev in production — `trigger/` dir is unused)

## Folder Structure
```
app/
  (auth)/          # login, signup, forgot-password
  (dashboard)/     # protected app routes
  api/             # route handlers (webhooks, subscriptions, admin, sync)
components/
  ui/              # shadcn primitives
  dashboard/       # dashboard-specific widgets
  landing/         # marketing pages
  layout/          # nav, sidebar, footer
  shared/          # cross-cutting (modals, tables)
lib/
  actions/         # server actions (auth, subscription, keys, settings…)
  dodo/client.ts   # lazy-init Dodo SDK (Proxy pattern — avoids build-time env errors)
  platforms/       # API platform integrations + sync-engine.ts (cron-based)
  ratelimit/       # checkRateLimit helper (falls through if Redis not configured)
  supabase/        # browser/server/middleware Supabase clients
  validations/     # Zod schemas
hooks/             # client-side React hooks
types/             # TypeScript types; database.ts has Subscription shape
supabase/
  migrations/      # 001 schema · 002 new_user · 003 fix_rls · 004 access_passes
                   # 005 dodo_payments · 006 price_snapshots
e2e/               # Playwright specs
tests/             # Vitest unit tests
```

## Key Files
| File | Purpose |
|---|---|
| `lib/dodo/client.ts` | Lazy Dodo SDK init (Proxy) |
| `lib/actions/auth.ts` | Server-side login + rate limiting |
| `lib/actions/subscription.ts` | getSubscription, cancelSubscription |
| `app/api/subscription/create/route.ts` | Dodo checkout + promo code |
| `app/api/webhooks/dodo/route.ts` | Standard Webhooks verification |
| `app/api/admin/discounts/route.ts` | Promo CRUD (auth via CRON_SECRET) |
| `lib/platforms/sync-engine.ts` | Full platform sync (Vercel Cron) |
| `lib/ratelimit/index.ts` | apiRateLimit, authRateLimit |

## Commands
```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm lint         # ESLint (Next.js rules)
pnpm type-check   # tsc --noEmit
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright e2e
pnpm db:push      # push migrations to Supabase
pnpm db:reset     # reset local Supabase schema
```

## Coding Conventions
- 2-space indent, semicolons, single quotes, `@/` import alias
- `PascalCase` components/types, `camelCase` functions/vars, `kebab-case` filenames
- `.tsx` for all React files, `.ts` for pure logic
- Server actions in `lib/actions/`, API routes in `app/api/`
- Webhook handler: instantiate `new Webhook(secret)` inside the handler (not module scope)

## Testing
- Unit tests in `tests/` for all `lib/` utilities, validations, server actions
- E2E tests in `e2e/` for critical auth and billing flows
- Run `pnpm test && pnpm lint && pnpm type-check` before every PR

## Security
- Never commit `.env.local`; use `.env.example` as the template
- Auth, billing, webhook, or encryption changes: audit `app/api/`, `lib/`, and `supabase/migrations/`
- RLS is enabled on all tables — always verify policies when adding new tables

## Active Context (as of 2026-03-25)
- Phases 0–6 complete; build passes, committed to `main`
- **Phase 7:** Manual smoke tests (Dodo test mode + live Supabase) — not yet done
- **Phase 8:** Production deploy — needs prod Supabase project, Dodo live mode, `vercel --prod`
- Pending env vars: `NEXT_PUBLIC_DODO_PRODUCT_MONTHLY`, `NEXT_PUBLIC_DODO_PRODUCT_ANNUAL`, `DODO_WEBHOOK_SECRET`
- Latest migration: `006_price_snapshots.sql` (dynamic regional pricing)

## Commit Style
Short imperative subjects with prefixes: `feat:`, `fix:`, `chore:`, `refactor:`. One change per commit. PRs must note any migration or env var changes; include screenshots for UI changes.
