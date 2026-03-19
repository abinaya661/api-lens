# API Lens — Production Execution Plan v5 (Dodo Payments)
## Full Developer Handoff | Code Snippets · SQL · File Paths

> **Target:** Publicly live on Vercel with Dodo Payments (global MoR), promo/discount codes, and all 7 providers syncing.
> **Estimated timeline:** 12 working days
> **Team:** FE Developer · BE Developer · Security Lead
> **Current status:** ~50% complete — see [Deploy Checklist doc] for full gap analysis.
> **Payment provider:** Dodo Payments (Merchant of Record) — handles global tax compliance, subscriptions, and payouts in 190+ countries. Replaces Razorpay entirely.

---

## Why Dodo Payments (Single Provider)

| Factor | Dodo Payments | Old Razorpay + Paddle Split |
|---|---|---|
| **India support** | Yes — INR payments, UPI coming | Razorpay for India only |
| **Global support** | 190+ countries, auto-tax, auto-currency | Paddle for international only |
| **Merchant of Record** | Yes — Dodo is the legal seller, handles VAT/GST/sales tax globally | Paddle only (Razorpay is just a gateway) |
| **Promo codes** | Native API — create, apply, pause, delete via SDK or dashboard | Razorpay coupons (limited) + custom DB for free passes |
| **Complexity** | 1 provider, 1 webhook, 1 SDK | 2 providers, 2 webhooks, location detection, 2 SDKs |
| **Pricing** | 4% + 15¢ (subscriptions) / 4% + ₹4 (India local) | Razorpay 2% + Paddle 5% + $0.50 |
| **Tax filing** | Dodo handles it all | You handle Indian GST, Paddle handles international |
| **Next.js + Supabase** | Official starter kit exists | Custom implementation required |

**Bottom line:** One provider, one integration, zero tax headaches. Simpler to build, simpler to maintain, simpler to debug.

---

## Quick Reference: Phase Map

| Phase | Name | Owner | Days | Gate |
|---|---|---|---|---|
| **0** | Environment Setup & Key Replacement | All | Day 1 | All env vars populated |
| **1** | Structural Blockers | BE + Security | Day 1 | `pnpm build` passes, signup works |
| **2** | Data Layer (real CRUD) | BE + FE | Days 2–3 | No mock data, DB reads/writes work |
| **3** | Security & Encryption | Security + BE | Day 4 | Vault live, rate limits enforced |
| **4** | Sync Engine & Providers | BE + Security | Days 5–6 | All 7 providers syncing |
| **5** | Payments, Email & Promo Codes (Dodo) | All | Day 7 | Trial → paid → cancel works |
| **6** | Missing Pages & Polish | FE + Security | Days 8–9 | All routes exist, audit passes |
| **7** | Pre-Production Testing | All | Day 10 | Full flow green |
| **8** | Vercel Production Launch | All | Days 11–12 | App live at production domain |

> ⛔ **Each phase is a hard gate.** Do not start the next phase until acceptance criteria are met.

---

## Phase 0 — Environment Setup & Key Replacement

**Owner:** All three developers together
**Effort:** ~2 hours
**Goal:** Every service account created, every environment variable populated, `.env.local` ready.

### 0.1 All Environment Variables

Copy `.env.example` to `.env.local` and fill in every value below. Share via password manager only — **never commit `.env.local`**.

| Variable | Placeholder | Where to get it | Phase needed |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOURPROJECT.supabase.co` | Supabase Dashboard → Project Settings → API | Phase 0 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Supabase Dashboard → Project Settings → API | Phase 0 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Supabase Dashboard → Project Settings → API | Phase 0 |
| `ENCRYPTION_KEY` | `0000...64 hex chars` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Phase 0 |
| `CRON_SECRET` | `your-secret-min-32-chars` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Phase 0 |
| `DODO_PAYMENTS_API_KEY` | `sk_test_...` | Dodo Dashboard → API Keys | Phase 5 |
| `DODO_WEBHOOK_SECRET` | `whsec_...` | Dodo Dashboard → Webhooks → Secret | Phase 5 |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` | Set to `test_mode` for dev, omit or `live_mode` for prod | Phase 5 |
| `NEXT_PUBLIC_DODO_PRODUCT_MONTHLY` | `prod_...` | Create product in Dodo Dashboard (see Phase 5.1) | Phase 5 |
| `NEXT_PUBLIC_DODO_PRODUCT_ANNUAL` | `prod_...` | Create product in Dodo Dashboard (see Phase 5.1) | Phase 5 |
| `RESEND_API_KEY` | `re_XXXXXXXX` | Resend Dashboard → API Keys | Phase 5 |
| `FROM_EMAIL` | `API Lens <noreply@apilens.dev>` | Use your verified domain in Resend | Phase 5 |
| `UPSTASH_REDIS_REST_URL` | `https://your-db.upstash.io` | Upstash Console → Database → REST API | Phase 3 |
| `UPSTASH_REDIS_REST_TOKEN` | `AXxx...` | Upstash Console → Database → REST API | Phase 3 |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` | Sentry Dashboard → Project → Settings → Client Keys | Phase 0 |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_XXXXXXXXX` | PostHog → Project Settings → Project API Key | Phase 0 |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | Usually this exact value | Phase 0 |
| `NEXT_PUBLIC_APP_URL` | `https://apilens.dev` | Your production domain | Phase 0 |
| `TRIGGER_API_KEY` | `tr_dev_XXXXXXXX` | Trigger.dev → Project → API Keys | Phase 4 |
| `TRIGGER_API_URL` | `https://api.trigger.dev` | Trigger.dev (usually this exact value) | Phase 4 |

> **Removed:** All Razorpay variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_ANNUAL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`). These are fully replaced by Dodo.

### 0.2 Service Accounts Checklist

- [ ] **Supabase** — dev project created (separate from future prod project)
- [ ] **Dodo Payments** — account created at [dodopayments.com](https://dodopayments.com), KYC completed
- [ ] **Resend** — account created, sending domain verified (DNS TXT/MX records added)
- [ ] **Trigger.dev** — project created, `@trigger.dev/sdk` v4 installed
- [ ] **Upstash** — Redis database created in the same region as your Vercel deployment
- [ ] **Sentry** — Next.js project created
- [ ] **PostHog** — project created
- [ ] **BetterStack** — account created for uptime monitoring

### 0.3 Remove Razorpay from Codebase

```bash
# Remove Razorpay SDK
pnpm remove razorpay

# Remove Razorpay-related files
rm -rf lib/razorpay/
rm -f app/api/webhooks/razorpay/route.ts
rm -f app/api/subscription/create/route.ts

# Install Dodo Payments SDK
pnpm add dodopayments standardwebhooks

# Verify
pnpm build
```

### 0.4 Vercel Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link repo to Vercel project
vercel link

# Add all env vars to Vercel
cat .env.local | while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  echo "Adding $key..."
  echo "$value" | vercel env add "$key" production preview
done
```

---

## Phase 1 — Structural Blockers

**Owner:** BE Developer + Security Lead
**Effort:** 4–6 hours
**Goal:** App compiles, new users get a company row, RLS is secure.

### 1.1 Add `handle_new_user()` Trigger

**File:** `supabase/migrations/002_handle_new_user.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.companies (id, owner_id, name, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Create trial subscription (7-day default)
  INSERT INTO public.subscriptions (
    id, user_id, status, trial_ends_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'trialing',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 Fix Overly Permissive RLS Policies

**File:** `supabase/migrations/003_fix_rls.sql`

```sql
-- Fix usage_records: only company members can insert
DROP POLICY IF EXISTS "insert_usage_records" ON public.usage_records;
CREATE POLICY "insert_usage_records" ON public.usage_records
  FOR INSERT WITH CHECK (
    key_id IN (
      SELECT id FROM public.api_keys
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Fix alerts: only company members can insert
DROP POLICY IF EXISTS "insert_alerts" ON public.alerts;
CREATE POLICY "insert_alerts" ON public.alerts
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Fix cost_estimates: scoped to user's company
DROP POLICY IF EXISTS "insert_cost_estimates" ON public.cost_estimates;
CREATE POLICY "insert_cost_estimates" ON public.cost_estimates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Fix audit_log: service_role only
DROP POLICY IF EXISTS "insert_audit_log" ON public.audit_log;
CREATE POLICY "insert_audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (false);

-- Fix notifications: service_role writes, users read own
DROP POLICY IF EXISTS "all_notifications" ON public.notifications;
CREATE POLICY "read_own_notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (false);

-- Fix subscriptions: users read own, service_role writes
DROP POLICY IF EXISTS "all_subscriptions" ON public.subscriptions;
CREATE POLICY "read_own_subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (false);
```

### 1.3 Acceptance Criteria — Phase 1

- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] New signup creates rows in `companies` AND `subscriptions`
- [ ] User A cannot query User B's `subscriptions`, `api_keys`, `projects`, `usage_records`
- [ ] Attempting to insert into `audit_log` as authenticated user returns permission denied

---

## Phase 2 — Data Layer (Real CRUD)

**Owner:** BE Developer (server actions) + FE Developer (hooks + pages)
**Effort:** Days 2–3 (parallel)
**Goal:** All CRUD persists to Supabase. Zero mock data files remain.

### 2.1 Server Actions Structure

Every file in `lib/actions/` must start with `'use server'`, use Zod for input validation, use the **server** Supabase client (not admin), and wrap everything in typed try/catch.

**Required action files (confirm all exist with real implementations):**

| File | Key functions |
|---|---|
| `lib/actions/keys.ts` | `addKey`, `listKeys`, `deleteKey`, `updateKey`, `validateKey` |
| `lib/actions/projects.ts` | `createProject`, `listProjects`, `getProject`, `updateProject`, `deleteProject` |
| `lib/actions/budgets.ts` | `createBudget`, `listBudgets`, `updateBudget`, `deleteBudget` |
| `lib/actions/alerts.ts` | `getAlerts`, `markRead`, `markAllRead`, `getUnreadCount` |
| `lib/actions/dashboard.ts` | `getDashboardData` (aggregation: total spend MTD, projection, budget remaining, daily chart, top 5 keys, last 5 alerts) |
| `lib/actions/settings.ts` | `getProfile`, `updateProfile` |
| `lib/actions/subscription.ts` | `getSubscription`, `cancelSubscription` (now calls Dodo API) |

### 2.2 Delete All Mock Data

```bash
find lib -name "mock*" -delete
find lib -name "*mock*" -delete
```

### 2.3 Acceptance Criteria — Phase 2

- [ ] All `lib/mock-data*.ts` files deleted
- [ ] Create project in UI → row appears in Supabase `projects` table
- [ ] Add key → encrypted row in `api_keys`, `key_hint` shows last 4 chars
- [ ] Empty dashboard shows `<EmptyState>` with "Add your first API key" CTA (not blank)

---

## Phase 3 — Security & Encryption

**Owner:** Security Lead + BE Developer
**Effort:** Day 4
**Goal:** Vault encryption live. Rate limits enforced. Cron routes protected.

### 3.1 Wire Supabase Vault Encryption

**File:** `lib/encryption/index.ts` — implement envelope encryption with Vault DEK wrapping. (See v4 plan for full implementation.)

### 3.2 Wire Rate Limiting

```typescript
// In lib/actions/keys.ts — add at the top of addKey():
import { checkRateLimit } from '@/lib/ratelimit';

export async function addKey(input: unknown) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const limited = await checkRateLimit(`add_key:${user.id}`, 10, 60);
  if (limited) return { error: 'Too many requests. Please wait.' };
  // ... rest of function
}

// In login action:
const limited = await checkRateLimit(`login:${email}`, 5, 60);
if (limited) return { error: 'Too many login attempts. Try again in a minute.' };
```

### 3.3 Protect Cron Routes

**Files:** `app/api/cron/sync-and-check/route.ts` and `app/api/cron/daily-tasks/route.ts`

```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... handler
}
```

### 3.4 Acceptance Criteria — Phase 3

- [ ] `encrypted_credentials` column contains Vault-wrapped format
- [ ] `curl` to cron endpoint without secret → `401`
- [ ] Rapid 6th login → rate limited
- [ ] 11th key creation in 60 seconds → rate limited

---

## Phase 4 — Sync Engine & Providers

**Owner:** BE Developer (adapters) + Security Lead (Trigger.dev pipeline)
**Effort:** Days 5–6
**Goal:** All 7 providers syncing. Dashboard auto-updates hourly.

### 4.1 Provider Adapters to Build

| File | Status | Auth method |
|---|---|---|
| `lib/providers/openai.ts` | ✅ Done | Admin API key |
| `lib/providers/anthropic.ts` | ✅ Done | Admin API key |
| `lib/providers/gemini.ts` | ❌ Build | Service Account JSON → GCP Billing API |
| `lib/providers/bedrock.ts` | ❌ Build | IAM key+secret → Cost Explorer API |
| `lib/providers/mistral.ts` | ❌ Build | Standard API key → usage endpoint |
| `lib/providers/cohere.ts` | ❌ Build | Standard API key → usage endpoint |
| `lib/providers/azure_openai.ts` | ❌ Build | Azure AD + endpoint URL → Cost Management API |

### 4.2 Trigger.dev Sync Pipeline

**File:** `trigger/sync.ts` — implement the full hourly sync pipeline:

```typescript
import { schedules, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { PROVIDER_ADAPTERS } from '@/lib/providers';
import { decryptCredentials } from '@/lib/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const hourlySync = schedules.task({
  id: 'hourly-sync',
  cron: '0 * * * *',
  run: async () => {
    const { data: keys } = await supabase
      .from('api_keys')
      .select('id, platform, encrypted_credentials, company_id, last_synced_at')
      .eq('health', 'active');

    if (!keys?.length) return { synced: 0 };
    let synced = 0;

    for (const key of keys) {
      try {
        const credentials = await decryptCredentials(key.encrypted_credentials);
        const adapter = PROVIDER_ADAPTERS[key.platform];
        if (!adapter) continue;

        const since = key.last_synced_at ? new Date(key.last_synced_at) : new Date(Date.now() - 86400000);
        const records = await adapter.fetchUsage(credentials, key.id, since);

        if (records.length > 0) {
          await supabase.from('usage_records').upsert(
            records.map(r => ({
              key_id: key.id, company_id: key.company_id, platform: key.platform,
              model: r.model, input_tokens: r.input_tokens, output_tokens: r.output_tokens,
              cost_usd: r.cost_usd, recorded_at: r.recorded_at, synced_at: new Date(),
            })),
            { onConflict: 'key_id,model,recorded_at' }
          );
        }

        await supabase.from('api_keys')
          .update({ last_synced_at: new Date(), health: 'active' })
          .eq('id', key.id);

        await evaluateBudgets(key.company_id);
        synced++;
      } catch (err) {
        await handleSyncFailure(key.id, err);
      }
    }
    return { synced };
  },
});

export const manualSync = task({
  id: 'manual-sync',
  run: async (payload: { keyId: string; userId: string }) => {
    // Same logic as hourlySync but for a single key
  },
});
```

### 4.3 Acceptance Criteria — Phase 4

- [ ] Real OpenAI key → usage on dashboard within 15 min
- [ ] Invalid key → `health = 'sync-error'` and alert created
- [ ] 30-day inactive key → flagged
- [ ] All 7 providers validate successfully

---

## Phase 5 — Payments, Email & Promo Codes (Dodo Payments)

**Owner:** All three developers (parallel)
**Effort:** Day 7
**Goal:** Dodo Payments live, emails sending, promo codes working.

### 5.1 Create Products in Dodo Dashboard

Do this in the **Dodo Payments Dashboard** before writing code:

1. Go to **Products → Create Product**
2. Create **Monthly Subscription:**
   - Name: `API Lens Monthly`
   - Type: `Subscription`
   - Price: `$5.99` (Dodo handles currency conversion automatically)
   - Billing period: `Monthly`
   - Metadata: `{"features": ["Unlimited API keys", "7 providers", "Budget alerts", "Email reports"]}`
   - Copy the product ID → set as `NEXT_PUBLIC_DODO_PRODUCT_MONTHLY` env var
3. Create **Annual Subscription:**
   - Name: `API Lens Annual`
   - Type: `Subscription`
   - Price: `$59.99`
   - Billing period: `Yearly`
   - Metadata: `{"features": ["Everything in Monthly", "2 months free", "Priority support"]}`
   - Copy the product ID → set as `NEXT_PUBLIC_DODO_PRODUCT_ANNUAL` env var

### 5.2 Dodo Payments SDK Setup

**File:** `lib/dodo/client.ts`

```typescript
import DodoPayments from 'dodopayments';

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode' ? 'test_mode' : undefined,
});
```

### 5.3 Subscription Creation (Checkout Session)

**File:** `app/api/subscription/create/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, discountCode } = await req.json();

  const productId = plan === 'annual'
    ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ANNUAL!
    : process.env.NEXT_PUBLIC_DODO_PRODUCT_MONTHLY!;

  // Create Dodo Checkout Session
  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: user.email!,
      name: user.user_metadata?.full_name || user.email!.split('@')[0],
    },
    // Pre-apply discount code if provided
    ...(discountCode ? { discount_code: discountCode } : {}),
    // Show discount code input field at checkout
    feature_flags: { allow_discount_code: true },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    metadata: {
      user_id: user.id,
      plan: plan,
    },
  });

  return Response.json({ checkout_url: session.checkout_url });
}
```

### 5.4 Webhook Handler

**File:** `app/api/webhooks/dodo/route.ts`

```typescript
import { Webhook } from 'standardwebhooks';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);

export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody = await request.text();

  // Verify webhook signature (Standard Webhooks spec)
  const webhookHeaders = {
    'webhook-id': headersList.get('webhook-id') || '',
    'webhook-signature': headersList.get('webhook-signature') || '',
    'webhook-timestamp': headersList.get('webhook-timestamp') || '',
  };

  try {
    webhook.verify(rawBody, webhookHeaders);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const adminSupabase = createAdminClient();

  switch (event.type) {
    case 'subscription.active': {
      const userId = event.data.metadata?.user_id;
      if (!userId) break;

      await adminSupabase.from('subscriptions').update({
        status: 'active',
        dodo_subscription_id: event.data.subscription_id,
        dodo_customer_id: event.data.customer?.customer_id,
        plan: event.data.metadata?.plan || 'monthly',
        period_end: event.data.current_period_end,
        last_payment_at: new Date(),
        updated_at: new Date(),
      }).eq('user_id', userId);
      break;
    }

    case 'subscription.renewed': {
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date(),
        period_end: event.data.current_period_end,
        updated_at: new Date(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.failed': {
      const sub = await adminSupabase.from('subscriptions')
        .select('user_id')
        .eq('dodo_subscription_id', event.data.subscription_id)
        .single();

      if (sub.data) {
        await adminSupabase.from('subscriptions').update({
          status: 'past_due',
          grace_period_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        }).eq('dodo_subscription_id', event.data.subscription_id);
        // Trigger dunning email via Resend
      }
      break;
    }

    case 'subscription.canceled': {
      await adminSupabase.from('subscriptions').update({
        status: 'cancelled',
        updated_at: new Date(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.completed': {
      // Log successful payment
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date(),
        updated_at: new Date(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'subscription.updated': {
      // Plan change (upgrade/downgrade)
      await adminSupabase.from('subscriptions').update({
        plan: event.data.metadata?.plan,
        updated_at: new Date(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
```

### 5.5 Cancel Subscription

**File:** `lib/actions/subscription.ts`

```typescript
'use server';

import { dodo } from '@/lib/dodo/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function cancelSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('dodo_subscription_id')
    .eq('user_id', user.id)
    .single();

  if (!sub?.dodo_subscription_id) return { error: 'No active subscription' };

  // Cancel at end of current billing period (user keeps access until period_end)
  await dodo.subscriptions.update(sub.dodo_subscription_id, {
    status: 'cancelled',
  });

  const adminSupabase = createAdminClient();
  await adminSupabase.from('subscriptions').update({
    status: 'cancelled',
    updated_at: new Date(),
  }).eq('user_id', user.id);

  return { success: true };
}
```

### 5.6 Database Schema Update (Replace Razorpay with Dodo)

**File:** `supabase/migrations/004_dodo_payments.sql`

```sql
-- Remove Razorpay columns if they exist
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS razorpay_subscription_id;

-- Add Dodo Payments columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id
  ON public.subscriptions(dodo_subscription_id)
  WHERE dodo_subscription_id IS NOT NULL;
```

### 5.7 Promo / Discount Code System (All via Dodo API)

Dodo handles **everything** natively — discount codes, cycle limits, activation/deactivation. No custom database table needed.

#### Creating Discount Codes

**Option A: Via Dodo Dashboard (no code)**
1. Dodo Dashboard → **Discounts** → **Create Discount**
2. Fill in:
   - Name: `Influencer 30-Day Pass`
   - Code: `INFLUENCER-ABC123`
   - Type: `Percentage` → `100%` (free for X cycles)
   - Cycle Limit: `1` (free for first month only, then auto-charges)
   - Max Redemptions: `1`
   - Expiration: set if needed

**Option B: Via API (programmatic)**

```typescript
// lib/actions/promos.ts
'use server';

import { dodo } from '@/lib/dodo/client';

// Create a 100% discount for 1 cycle = free month for influencer
export async function createInfluencerPass(code: string, description: string) {
  const discount = await dodo.discounts.create({
    name: description,
    code: code.toUpperCase(),
    type: 'percentage',
    amount: 100,        // 100% off
    // cycle_limit: 1,  // Free for 1 billing cycle, then charges normally
    max_redemptions: 1, // Single use
  });
  return discount;
}

// Create a 15-day pass (use a fixed discount on a monthly plan — effectively free for ~15 days)
// Alternative: create a special "15-day" product with 15-day billing period at $0
export async function create15DayPass(code: string, description: string, maxUses: number) {
  const discount = await dodo.discounts.create({
    name: description,
    code: code.toUpperCase(),
    type: 'percentage',
    amount: 100,
    max_redemptions: maxUses,
  });
  return discount;
}

// Create a standard discount (e.g., 20% off for 3 months)
export async function createDiscountCode(code: string, percentOff: number, description: string) {
  const discount = await dodo.discounts.create({
    name: description,
    code: code.toUpperCase(),
    type: 'percentage',
    amount: percentOff,
    max_redemptions: 100,
  });
  return discount;
}
```

#### Starting and Stopping Codes

```typescript
// Deactivate (stop) a code
export async function deactivateCode(discountId: string) {
  await dodo.discounts.delete(discountId);
  return { success: true };
}

// List all active codes with usage stats
export async function listDiscountCodes() {
  const discounts = await dodo.discounts.list();
  return discounts;
}
```

#### Admin API (for you to manage from terminal)

**File:** `app/api/admin/discounts/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';

// Protect with CRON_SECRET
function checkAuth(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

// GET — List all discount codes
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const discounts = await dodo.discounts.list();
  return Response.json({ discounts });
}

// POST — Create a new discount code
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { code, name, type, amount, max_redemptions } = await req.json();

  const discount = await dodo.discounts.create({
    name, code: code.toUpperCase(), type, amount, max_redemptions,
  });
  return Response.json({ discount });
}

// DELETE — Remove/deactivate a discount code
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { discountId } = await req.json();
  await dodo.discounts.delete(discountId);
  return Response.json({ success: true });
}
```

#### Managing Codes from Terminal

```bash
# Create a 30-day influencer pass (100% off, 1 cycle, 1 use)
curl -X POST https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "INFLUENCER-ABC123", "name": "Influencer: @techreviewer", "type": "percentage", "amount": 100, "max_redemptions": 1}'

# Create a 20% off campaign code (50 uses)
curl -X POST https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "LAUNCH20", "name": "Launch 20% off", "type": "percentage", "amount": 20, "max_redemptions": 50}'

# List all codes + usage
curl https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Delete/deactivate a code
curl -X DELETE https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"discountId": "disc_xxx"}'
```

### 5.8 Checkout UI Component

**File:** `components/pricing/checkout-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CheckoutButton({ plan, discountCode }: { plan: 'monthly' | 'annual'; discountCode?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch('/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ plan, discountCode }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.checkout_url) {
      // Redirect to Dodo hosted checkout (handles payment UI, tax, currency)
      window.location.href = data.checkout_url;
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleCheckout} disabled={loading} className="w-full">
      {loading ? 'Loading...' : `Subscribe ${plan === 'annual' ? 'Annually — $59.99/yr' : 'Monthly — $5.99/mo'}`}
    </Button>
  );
}
```

### 5.9 Discount Code Input on Pricing Page

```typescript
// In pricing page or settings/billing — simple input for applying a promo code
function PromoCodeSection() {
  const [code, setCode] = useState('');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Have a promo code?</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter code (e.g., INFLUENCER-ABC123)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
        />
        <CheckoutButton plan="monthly" discountCode={code || undefined} />
      </div>
      <p className="text-xs text-muted-foreground">
        The code will be applied at checkout. You can also enter it directly on the payment page.
      </p>
    </div>
  );
}
```

> **Note:** Dodo also shows a discount code input field directly on their hosted checkout page when `feature_flags.allow_discount_code` is set to `true`. So users can enter codes even if they skip your in-app input.

### 5.10 Resend Email Templates

**File:** `lib/email/index.ts` — same as before (Resend is independent of payment provider)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBudgetAlert(to: string, data: { threshold: number; spend: number; budget: number; budgetName: string }) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject: `Budget Alert: ${data.budgetName} at ${data.threshold}%`,
    html: `<h2>Budget Threshold Reached</h2><p>Your budget <strong>${data.budgetName}</strong> is at <strong>${data.threshold}%</strong>.</p><p>Spend: <strong>$${data.spend.toFixed(2)}</strong> / <strong>$${data.budget.toFixed(2)}</strong></p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/alerts">View in API Lens</a></p>`,
  });
}

export async function sendTrialEndingEmail(to: string, daysLeft: number) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!, to,
    subject: `Your API Lens trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: `<h2>Trial almost over</h2><p><strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> left.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">Upgrade now</a></p>`,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!, to,
    subject: `Welcome to API Lens, ${name}!`,
    html: `<h2>Welcome!</h2><p>Your 7-day free trial has started.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding">Get started</a></p>`,
  });
}
```

### 5.11 Acceptance Criteria — Phase 5

- [ ] Signup → trial starts at 7 days → countdown banner on dashboard
- [ ] Click "Subscribe Monthly" → redirected to Dodo checkout → payment → redirected back → `status = 'active'`
- [ ] Webhook fires on payment → subscription row updated in Supabase
- [ ] Cancel subscription → `status = 'cancelled'`, access continues until `period_end`
- [ ] Create discount code `LAUNCH20` (20% off) → apply at checkout → price reduced
- [ ] Create code `INFLUENCER-FREE` (100% off, 1 use) → checkout → $0 charged → subscription active
- [ ] Delete discount code → code stops working at checkout
- [ ] Budget alert → email delivered (check Resend dashboard)

---

## Phase 6 — Missing Pages & Polish

**Owner:** FE Developer + Security Lead (audit)
**Effort:** Days 8–9

### 6.1 Required Pages to Build

| Route | What it shows | Priority |
|---|---|---|
| `/keys/[id]` | Key health, sync history, usage chart, assigned project | High |
| `/projects/[id]` | Project spend, budget bar, key table, daily chart | High |
| `/reset-password` | Password reset form (Supabase Auth) | High |
| `/pricing` | Plan toggle (monthly/annual), Dodo checkout CTA, promo code input | High |
| `/security` | Marketing page: encryption, RLS, audit log explanation | Medium |
| `/settings/profile` | Name, email, company name | Medium |
| `/settings/billing` | Current plan, Dodo customer portal link, cancel, promo code entry | High |
| `/settings/notifications` | Toggle email/in-app notification types | Medium |

### 6.2 Remove Razorpay Remnants

```bash
# Verify no Razorpay imports remain
grep -r "razorpay" --include="*.ts" --include="*.tsx" lib/ app/ components/
# Should return zero results

# Remove unused deps
pnpm remove framer-motion
pnpm add next-themes
```

### 6.3 Security Final Audit

- [ ] Hit every endpoint — no plaintext API keys in response
- [ ] 2-user RLS test on every table
- [ ] Tampered webhook to `/api/webhooks/dodo` → rejected (invalid signature)
- [ ] Rate limiting verified on login + key creation
- [ ] Lighthouse accessibility score ≥ 90

### 6.4 Acceptance Criteria — Phase 6

- [ ] All routes render without errors
- [ ] Promo code input on `/pricing` and `/settings/billing`
- [ ] No plaintext API keys anywhere
- [ ] All pages responsive at 375px / 768px / 1280px

---

## Phase 7 — Pre-Production Testing

**Owner:** All three
**Effort:** Day 10

### 7.1 Full Flow Test (run on staging)

```
1.  Fresh signup → verify email → company + subscription rows created
2.  Trial countdown shows 7 days on dashboard
3.  Onboarding wizard: add OpenAI key → create project → set $100 budget
4.  Dashboard shows real sync data within 15 minutes
5.  Budget at $51 → 50% threshold alert fires → email received
6.  Cost estimator works at /estimator without login
7.  Navigate to /pricing → click Monthly → Dodo checkout → use test card
8.  Webhook fires → subscription status = 'active' in Supabase
9.  Apply discount code LAUNCH20 → price shows 20% off on Dodo checkout
10. Apply code INFLUENCER-FREE → $0 checkout → subscription active
11. Cancel subscription → status = 'cancelled'
12. Create User B → verify User B cannot see User A's data
13. Check Sentry → zero new errors
14. Check PostHog → events: signup, key_added, project_created, budget_set
```

### 7.2 Dodo Test Mode

Dodo's test mode (`DODO_PAYMENTS_ENVIRONMENT=test_mode`) processes all transactions without real charges. No special test card numbers needed — any valid card format works in test mode.

### 7.3 Acceptance Criteria — Phase 7

- [ ] All 14 flow steps pass
- [ ] Zero Sentry errors
- [ ] Dodo webhook events processed correctly for all subscription lifecycle events

---

## Phase 8 — Vercel Production Launch

**Owner:** All three
**Effort:** Days 11–12

### 8.1 Create Production Supabase Project

```bash
# Create NEW Supabase project "api-lens-prod"
supabase link --project-ref YOUR_PROD_PROJECT_REF
supabase db push
supabase db seed --file supabase/seeds/model_pricing.sql
```

### 8.2 Switch Dodo to Live Mode

1. Dodo Dashboard → **Settings → API Keys → Generate Live Keys**
2. Update Vercel production env vars:
   - `DODO_PAYMENTS_API_KEY` → live key (`sk_live_...`)
   - `DODO_PAYMENTS_ENVIRONMENT` → remove this var entirely (defaults to live)
3. Update Dodo webhook URL to `https://apilens.dev/api/webhooks/dodo`
4. Regenerate webhook secret → update `DODO_WEBHOOK_SECRET` in Vercel
5. Recreate your subscription products in **live mode** → update product IDs

### 8.3 All Production Environment Variables

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 🔴 Replace | Prod Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔴 Replace | Prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Replace | Prod service role key |
| `ENCRYPTION_KEY` | 🟡 Keep | Same 64-char hex for all encrypted data |
| `CRON_SECRET` | 🟡 Keep | Also used as admin API bearer token |
| `DODO_PAYMENTS_API_KEY` | 🔴 Replace | `sk_test_` → `sk_live_` |
| `DODO_WEBHOOK_SECRET` | 🔴 Replace | Regenerate for prod webhook |
| `DODO_PAYMENTS_ENVIRONMENT` | 🔴 Remove | Omit entirely for live mode |
| `NEXT_PUBLIC_DODO_PRODUCT_MONTHLY` | 🔴 Replace | Live mode product ID |
| `NEXT_PUBLIC_DODO_PRODUCT_ANNUAL` | 🔴 Replace | Live mode product ID |
| `RESEND_API_KEY` | 🟡 Verify | Ensure domain verified |
| `FROM_EMAIL` | 🟡 Verify | Must match verified domain |
| `UPSTASH_REDIS_REST_URL` | 🟡 Keep or replace | Prod Redis |
| `UPSTASH_REDIS_REST_TOKEN` | 🟡 Keep or replace | Prod Redis token |
| `NEXT_PUBLIC_SENTRY_DSN` | 🔴 Replace | Separate prod Sentry project |
| `NEXT_PUBLIC_POSTHOG_KEY` | 🟡 Can reuse | Or separate prod project |
| `NEXT_PUBLIC_APP_URL` | 🔴 Replace | `https://apilens.dev` |
| `TRIGGER_API_KEY` | 🔴 Replace | Prod environment key |

### 8.4 Deploy to Production

```bash
# Deploy
vercel --prod

# Custom domain
vercel domains add apilens.dev
# Add DNS records as instructed (A record + CNAME)
# SSL auto-provisions (~2 min)

# Deploy Trigger.dev tasks
npx trigger.dev@latest deploy --env prod
```

### 8.5 BetterStack Monitors

1. `https://apilens.dev` → every 1 min
2. `https://apilens.dev/api/health` → every 1 min
3. Provider status pages → every 5 min

### 8.6 Post-Launch 24-Hour Monitoring

```
Hour 0:  apilens.dev loads < 2s, signup works, Supabase rows created, Sentry clean
Hour 4:  First Trigger.dev sync completed, at least 1 usage_record in prod
Hour 8:  Budget alert email sent, Dodo checkout works in live mode
Hour 24: Review Trigger.dev logs, Sentry errors < 1%, Resend deliverability > 95%
```

### 8.7 Rollback

```bash
vercel rollback [previous-deployment-url]
```

**Triggers:** Sentry error rate > 5%, sync failing > 50% of keys, plaintext key exposure, webhook not processing, P95 > 3s.

---

## Discount Code Quick Reference

### Create Codes

```bash
# 100% off, 1 use (influencer 1-month free pass)
curl -X POST https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "INFLUENCER-ABC123", "name": "Influencer @techreviewer", "type": "percentage", "amount": 100, "max_redemptions": 1}'

# 20% off, 50 uses (launch campaign)
curl -X POST https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "LAUNCH20", "name": "Launch discount", "type": "percentage", "amount": 20, "max_redemptions": 50}'

# Fixed $2 off (use "fixed" type)
curl -X POST https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code": "SAVE2", "name": "$2 off", "type": "fixed", "amount": 200, "max_redemptions": 100}'
```

### Stop / Delete Codes

```bash
curl -X DELETE https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"discountId": "disc_xxx"}'
```

### List All Codes

```bash
curl https://apilens.dev/api/admin/discounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Via Dodo Dashboard (No Code)

Dodo Dashboard → **Discounts** → Create / Delete / View usage stats. Everything syncs automatically.

---

*Last updated: March 19, 2026 | API Lens Production Execution Plan v5 (Dodo Payments)*
