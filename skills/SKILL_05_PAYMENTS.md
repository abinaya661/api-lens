# Skill 05 — Payment Systems & Subscription Logic
# Expert: PAY — Payments Expert

The webhook handler is the most critical piece of infrastructure in the app.
More critical than the UI. More critical than the API. A bug here means
users get charged but have no access, or get access but are not charged.
Both outcomes destroy trust. This file covers every payment detail correctly.

---

## Why Razorpay for India

Stripe does not support INR subscriptions for Indian businesses without
significant compliance overhead. Razorpay is built for India, supports
UPI, cards, net banking, wallets, handles GST invoicing natively,
and KYC is straightforward for Indian founders.

---

## Plan Definitions — single source of truth

// /lib/razorpay/plans.ts
// Amounts in paise (1 INR = 100 paise).
// Never hardcode prices anywhere else. Always import from here.
export const PLANS = {
  monthly: {
    razorpayPlanId: process.env.RAZORPAY_PLAN_MONTHLY!,
    amountPaise:    41_500,    // ₹415.00
    displayUsd:     '~$4.99',
    displayInr:     '₹415',
    interval:       'monthly' as const,
    trialDays:      7,
    description:    'API Lens Pro — Monthly',
  },
  annual: {
    razorpayPlanId: process.env.RAZORPAY_PLAN_ANNUAL!,
    amountPaise:    4_14_900,  // ₹4,149.00
    displayUsd:     '~$49.99',
    displayInr:     '₹4,149',
    interval:       'yearly' as const,
    trialDays:      7,
    description:    'API Lens Pro — Annual (save 2 months)',
  },
} as const

export type PlanKey = keyof typeof PLANS

---

## Webhook Handler — complete implementation

// /app/api/webhooks/razorpay/route.ts
import crypto      from 'node:crypto'
import { headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const hdrs    = await headers()
  const sig     = hdrs.get('x-razorpay-signature')

  if (!sig) return new Response('Missing signature', { status: 400 })

  // timingSafeEqual prevents timing attacks.
  // Naive string comparison (sig === expected) leaks information through
  // execution time — attackers can determine correct characters one by one.
  // timingSafeEqual always takes the same time regardless of where strings differ.
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  let isValid = false
  try {
    isValid = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'))
  } catch {
    isValid = false // timingSafeEqual throws if buffer lengths differ — signature is wrong
  }

  if (!isValid) return new Response('Invalid signature', { status: 401 })

  const event = JSON.parse(rawBody) as {
    event:   string
    payload: Record<string, { entity: Record<string, unknown> }>
  }

  try {
    switch (event.event) {

      case 'subscription.activated': {
        // User started subscription or came out of trial. Grant full access.
        const sub = event.payload.subscription.entity
        await adminClient.from('subscriptions').upsert({
          razorpay_subscription_id: sub.id as string,
          plan:                     'pro',
          current_period_start: new Date((sub.current_start as number) * 1000).toISOString(),
          current_period_end:   new Date((sub.current_end   as number) * 1000).toISOString(),
          updated_at:           new Date().toISOString(),
        }, { onConflict: 'razorpay_subscription_id' })
        // upsert not update — event may arrive before our create-subscription
        // call completes. Upsert handles the race condition correctly.
        break
      }

      case 'subscription.charged': {
        // Recurring charge succeeded. Extend the period.
        const sub = event.payload.subscription.entity
        await adminClient.from('subscriptions')
          .update({
            plan:               'pro',
            current_period_end: new Date((sub.current_end as number) * 1000).toISOString(),
            updated_at:         new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', sub.id as string)
        break
      }

      case 'subscription.halted': {
        // Payment failed repeatedly. Downgrade but do NOT delete data.
        // User may pay and come back. Preserve everything.
        const sub = event.payload.subscription.entity
        await adminClient.from('subscriptions')
          .update({ plan: 'paused', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', sub.id as string)
        // TODO: trigger payment-failed email via Resend
        break
      }

      case 'subscription.cancelled': {
        // User cancelled. Keep access until current_period_end.
        const sub = event.payload.subscription.entity
        await adminClient.from('subscriptions')
          .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', sub.id as string)
        break
      }

      case 'subscription.completed': {
        // Subscription ended naturally (e.g. annual plan after 1 year).
        const sub = event.payload.subscription.entity
        await adminClient.from('subscriptions')
          .update({ plan: 'expired', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', sub.id as string)
        break
      }

      case 'payment.failed': {
        // Individual payment failed. Razorpay will retry. Create an in-app alert.
        const payment = event.payload.payment.entity
        console.warn('[razorpay] Payment failed:', payment.id)
        // TODO: create alert record, show in-app banner
        break
      }

      default:
        console.log('[razorpay webhook] Unhandled event:', event.event)
    }

  } catch (err) {
    console.error('[razorpay webhook] Error:', event.event, err)
    // Return 500 so Razorpay retries. If our DB write failed, we want
    // Razorpay to try again rather than marking event as delivered.
    return new Response('Handler error', { status: 500 })
  }

  // Always return 200 for handled events.
  // Non-200 causes Razorpay to retry — potentially causing duplicate processing.
  return new Response('ok', { status: 200 })
}

---

## Subscription State Machine

// Valid transitions only:
//
// trial → pro           (subscription.activated after trial)
// trial → expired       (trial ended, no payment)
// pro   → cancelled     (user cancelled — still has access until period end)
// pro   → paused        (subscription.halted — payment failures)
// pro   → expired       (subscription.completed — natural end)
// paused → pro          (subscription.activated — user paid again)
// cancelled → pro       (user resubscribed)
//
// NEVER delete subscription rows. History is permanent.
// NEVER remove access before current_period_end even if cancelled.

---

## Checking subscription status in Server Components

// /lib/razorpay/helpers.ts
import { createClient } from '@/lib/supabase/server'

export type SubscriptionStatus = 'trial' | 'pro' | 'annual' | 'paused' | 'expired' | 'cancelled' | 'none'

export async function getSubscriptionStatus(): Promise<{
  status:           SubscriptionStatus
  trialEndsAt:      string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { status: 'none', trialEndsAt: null, currentPeriodEnd: null, cancelAtPeriodEnd: false }

  const { data } = await supabase
    .from('subscriptions')
    .select('plan,trial_ends_at,current_period_end,cancel_at_period_end')
    .eq('user_id', user.id)
    .single()

  if (!data) return { status: 'none', trialEndsAt: null, currentPeriodEnd: null, cancelAtPeriodEnd: false }

  return {
    status:            data.plan as SubscriptionStatus,
    trialEndsAt:       data.trial_ends_at,
    currentPeriodEnd:  data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  }
}

export function hasActiveAccess(status: SubscriptionStatus): boolean {
  return status === 'trial' || status === 'pro' || status === 'annual'
}

---

## Trial expiry emails — send via Resend

// Send at:
//   trial_ends_at - 3 days  → "Your trial ends in 3 days"
//   trial_ends_at - 1 day   → "Your trial ends tomorrow"
//   trial_ends_at            → "Your trial has ended"
//
// Check daily in /api/cron/daily-tasks route.
// Use the trial-ending.tsx and trial-expired.tsx email templates.
// Never send more than one email per day per user per type.
// Track sent emails by checking is_emailed on alert records.

---

## Razorpay hosted checkout flow

// Never build a custom payment form. Always use Razorpay hosted checkout.
// Card data NEVER touches our servers — Razorpay handles PCI compliance.
//
// Flow:
// 1. User clicks "Start Trial" or "Subscribe"
// 2. Server Action creates a Razorpay subscription via API
// 3. Returns subscription ID and payment link
// 4. Client redirects to Razorpay hosted checkout URL
// 5. Razorpay sends webhook events to /api/webhooks/razorpay
// 6. Webhook updates subscriptions table
// 7. User redirected back to /settings/billing with ?success=1

import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createSubscription(planKey: PlanKey, userId: string) {
  const plan = PLANS[planKey]
  const subscription = await razorpay.subscriptions.create({
    plan_id:       plan.razorpayPlanId,
    total_count:   planKey === 'annual' ? 1 : 12,
    trial_enabled: true,
    notify_info: {
      notify_phone: '',
      notify_email: '',  // filled from user profile
    },
    notes: { user_id: userId },
  })
  return subscription
}
