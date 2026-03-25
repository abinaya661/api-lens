# Implementation Plan: Dynamic Pricing, Enterprise Tier, Price Sync & Autopay

## Summary of Changes

Three major features, executed sequentially:
1. **Dynamic Regional Pricing** — region-aware price display + Dodo product sync
2. **Enterprise "Coming Soon" Tier** — UI card + "Notify Me" email collection
3. **Autopay After Trial** — collect card at signup, auto-charge when trial ends

---

## Phase 1: Dynamic Regional Pricing

### 1A. Update `lib/regional-pricing.ts` — new price tiers

**New pricing structure:**

| Region | Monthly | Annual | Currency |
|--------|---------|--------|----------|
| North America (US, CA) | 5.99 | 59.99 | USD / CAD |
| Europe (EU countries) | 5.99 | 59.99 | EUR |
| UK | 5.99 | 59.99 | GBP |
| India (IN) | 399 | 3,999 | INR |
| Rest of World (default) | 4.99 | 49.99 | USD |

Changes:
- Update India: `₹499 → ₹399` monthly, `₹4,999 → ₹3,999` annual
- Europe: `€5.49 → €5.99` monthly, `€54.99 → €59.99` annual
- UK: `£4.79 → £5.99` monthly, `£47.99 → £59.99` annual
- Canada: `CA$7.99 → CA$5.99` monthly, `CA$79.99 → CA$59.99` annual
- Remove separate Japan, Brazil, Australia specific prices (they'll fall to RoW default)
- Change default (RoW) from `$5.99/$59.99` to `$4.99/$49.99`

**Files:** `lib/regional-pricing.ts`

### 1B. Ensure all display surfaces use the hook consistently

Already done — landing page, dashboard subscription page, and hero all use `useRegionalPrice()` + `formatPrice()`. No changes needed here.

### 1C. Fix price mismatch between website and Dodo checkout

**Root cause:** The prices displayed on the website are "approximate display prices" while Dodo Payments charges based on product configuration in their dashboard. Since we use a single `DODO_PLAN_MONTHLY_ID` / `DODO_PLAN_ANNUAL_ID` for all regions, Dodo converts to the user's currency at its own rate, which may differ from what we show.

**Solution:** Since Dodo is the Merchant of Record and handles currency conversion, we need to:
1. Set the base USD price in Dodo products to match our RoW default ($4.99/$49.99)
2. Add a note in the pricing display: "Prices shown are approximate. Final amount in your local currency is determined at checkout."
3. Alternatively, if Dodo supports region-specific product IDs, create separate products per region and pass the correct one based on geo. This requires checking Dodo's API capabilities.

**Recommended approach:** Add a small disclaimer under prices, and document the Dodo dashboard configuration needed. The exact Dodo product prices need to be configured by the user in their Dodo dashboard to match.

**Files:** `components/landing/pricing-section.tsx`, `app/(dashboard)/subscription/page.tsx`

### 1D. Update Terms of Service

Change the hardcoded `$5.99/month` to mention regional pricing.

**Files:** `app/terms/page.tsx`

---

## Phase 2: Enterprise "Coming Soon" Tier + Notify Me

### 2A. Add enterprise tier to regional pricing config

Add enterprise pricing to the `RegionalPrice` interface:
- `enterprise_monthly: string` and `enterprise_annual: string`
- US: $9.99/month, $99.99/year
- Scale proportionally for other regions

**Files:** `lib/regional-pricing.ts`

### 2B. Create `enterprise_waitlist` table in Supabase

New migration to create a table for email collection:
```sql
CREATE TABLE public.enterprise_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX ON public.enterprise_waitlist (email);
```

**Files:** `supabase/migrations/007_enterprise_waitlist.sql`

### 2C. Create API endpoint for "Notify Me"

`POST /api/enterprise/notify` — accepts `{ email }`, inserts into `enterprise_waitlist`.

**Files:** `app/api/enterprise/notify/route.ts`

### 2D. Add Enterprise card to landing page pricing section

Add a third pricing card (or modify the grid) showing:
- "Enterprise" heading
- $9.99/month, $99.99/year (regional)
- "Coming Soon" badge
- "Notify Me" button with email input
- Features list (everything in Pro + advanced features)

**Files:** `components/landing/pricing-section.tsx`

### 2E. Add Enterprise card to dashboard subscription page

Similar "Coming Soon" card in the dashboard pricing grid.

**Files:** `app/(dashboard)/subscription/page.tsx`

---

## Phase 3: Autopay After Trial (Card at Signup)

### 3A. Change signup flow to collect payment upfront

Instead of creating a free trial and later redirecting to checkout, the signup flow becomes:
1. User signs up (creates auth account)
2. Immediately redirect to Dodo checkout with `trial_period_days` parameter
3. Dodo collects card info but doesn't charge until trial ends
4. On successful card collection, Dodo sends `subscription.active` webhook (or `subscription.trialing`)

**Requires:** Dodo Payments must support trial periods on subscriptions. The checkout session creation needs a `trial_period_days: 7` parameter.

**Files:**
- `app/api/subscription/create/route.ts` — add `trial_period_days` support
- `app/(dashboard)/subscription/page.tsx` — update messaging
- `app/signup/page.tsx` or equivalent — redirect to checkout after signup

### 3B. Update webhook handler for trial lifecycle

Handle new Dodo events:
- `subscription.trialing` — card collected, trial started
- `subscription.active` — trial ended, first charge successful (auto-transition)
- `subscription.trial_expired` — if trial ends and charge fails

**Files:** `app/api/webhooks/dodo/route.ts`

### 3C. Update database trigger

The signup trigger currently creates a `trialing` subscription. With autopay, the subscription creation should wait for the Dodo webhook confirmation (card collected). Or: keep creating the trial row, but add a flag like `payment_method_collected: boolean`.

**Files:** `supabase/migrations/002_handle_new_user.sql` (new migration to modify)

### 3D. Add trial countdown + auto-charge messaging in UI

Show users:
- "Your trial ends on [date]. Your card will be charged automatically."
- Option to cancel before trial ends
- Clear messaging about what happens when trial converts

**Files:** `app/(dashboard)/settings/billing/page.tsx`, `app/(dashboard)/subscription/page.tsx`

---

## Execution Order

1. **Phase 1** (Dynamic Pricing) — can be done immediately, code-only changes
2. **Phase 2** (Enterprise Coming Soon) — needs migration + new API + UI
3. **Phase 3** (Autopay) — most complex, needs Dodo API investigation + migration + signup flow rewrite

Each phase will be committed separately. We'll start with Phase 1.
