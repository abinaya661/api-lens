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
    amountPaise:    41_500,   // ₹415.00
    displayUsd:     '~$4.99',
    displayInr:     '₹415',
    interval:       'monthly' as const,
    trialDays:      7,
    description:    'API Lens Pro — Monthly',
  },
  annual: {
    razorpayPlanId: process.env.RAZORPAY_PLAN_ANNUAL!,
    amountPaise:    4_14_900, // ₹4,149.00
    displayUsd:     '~$49.99',
    displayInr:     '₹4,149',
    interval:       'yearly' as const,
    trialDays:      7,
    description:    'API Lens Pro — Annual (save 2 months)',
  },
} as const

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