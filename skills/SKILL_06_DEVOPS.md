# Skill 06 — Infrastructure, Scale & DevOps
# Expert: DVO — DevOps & Scale Expert

I have built systems handling 10 million requests per day on infrastructure
that costs less than most people's rent. The secret is not spending money
on servers. It is designing your application to work with the grain of
your infrastructure, not against it.

---

## Why Vercel Handles 1 Lakh Users Without Configuration

Vercel uses Edge Network — your code runs in data centres closest to each user.
Auto-scaling spins up more instances automatically when traffic increases.
You pay only for what you use. No server to manage. No Nginx. No Docker.

Next.js Server Components and Server Actions run as serverless functions.
Each request is a fresh invocation. No shared state between requests.
This is what makes Vercel scale effortlessly. Use Supabase for all state.

---

## Vercel Free Plan — Cron Job Limits

Vercel Hobby (free): maximum 2 cron jobs, minimum interval every 1 minute.
Vercel Pro ($20/month): unlimited cron jobs.

API Lens uses exactly 2 cron jobs designed to fit the free plan perfectly.
We combine related tasks into single routes so we never need to upgrade.

---

## vercel.json — Place in project root

{
  "crons": [
    {
      "path":     "/api/cron/sync-and-check",
      "schedule": "*/15 * * * *"
    },
    {
      "path":     "/api/cron/daily-tasks",
      "schedule": "0 7 * * *"
    }
  ]
}

---

## Why These Exact Schedules

sync-and-check every 15 minutes (*/15 * * * *):

  This single job does two things in sequence:
  1. Fetches latest usage data from all platforms (3 batches by adapter pattern)
  2. Checks all budgets against the freshly synced data

  Why 15 minutes and not faster:
  OpenAI usage API updates every 5-15 minutes on their end.
  Anthropic is similar. Gemini has a 3-hour delay. AWS Cost Explorer updates daily.
  Polling every 1 minute would fetch identical data 14 times out of 15.
  15 minutes is the realistic minimum that produces new data.

  Why combine sync and budget check:
  Budget check always needs fresh data to be accurate.
  Running budget check immediately after sync in the same route means
  alerts are always based on the latest numbers.
  Two separate jobs could race — budget check running on stale data.

  User experience: dashboard data is never more than 15 minutes old.
  Budget alert emails arrive within 15 minutes of crossing a limit.

daily-tasks every day at 7am UTC (0 7 * * *):

  This single job does five things in sequence:
  1. OpenRouter balance diff (Pattern 1 — only syncs daily, not every 15 min)
  2. Price change detection — compare today's platform prices to yesterday
  3. Waste detection — flag keys with no activity in 30+ days
  4. Rotation reminders — keys 80+ days old
  5. Monthly report — only runs on the 1st of the month (checked inside code)

  Why 7am UTC:
  Reasonable time for Indian founders (12:30pm IST).
  Users see price change and waste alerts at the start of their working day.
  Monthly reports arrive on the 1st of the month at a reasonable time.

---

## sync-and-check route — full implementation

// /app/api/cron/sync-and-check/route.ts
// Runs every 15 minutes.
// 3 batches — one per adapter pattern group.
// Pattern 1 (OpenRouter) syncs daily in daily-tasks, NOT here.
// Each batch independent — one failing does not stop others.
// Per-key timeout: 30 seconds. Per-batch overall: 60 seconds.

export const maxDuration = 300  // 5 minutes total for the whole route

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }

  // ── STEP 1: SYNC USAGE ──────────────────────────────────────────

  const { data: keys } = await adminClient
    .from('api_keys')
    .select('id,user_id,provider,encrypted_key,endpoint_url,detected_pattern')
    .eq('is_active', true)
    .eq('is_valid',  true)
    .not('detected_pattern', 'eq', 1)  // Pattern 1 (OpenRouter) runs in daily-tasks

  const syncResults = { success: 0, failed: 0, skipped: 0 }

  // Batch by pattern: Pattern 2, Pattern 3, Pattern 4 each run independently
  const byPattern = {
    2: keys?.filter(k => k.detected_pattern === 2) ?? [],
    3: keys?.filter(k => k.detected_pattern === 3) ?? [],
    4: keys?.filter(k => k.detected_pattern === 4) ?? [],
  }

  for (const [, batchKeys] of Object.entries(byPattern)) {
    // Process each batch in parallel with a concurrency of 10
    const BATCH_SIZE = 10
    for (let i = 0; i < batchKeys.length; i += BATCH_SIZE) {
      const chunk = batchKeys.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        chunk.map(async (key) => {
          try {
            const { decrypt }    = await import('@/lib/encryption')
            const { fetchUsage } = await import('@/lib/platforms')
            const plainKey       = decrypt(key.encrypted_key)
            const today          = new Date().toISOString().split('T')[0]!
            const weekAgo        = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!
            const records        = await fetchUsage(key.provider, plainKey, weekAgo, today, {
              endpointUrl: key.endpoint_url ?? undefined,
            })

            if (records.length === 0) { syncResults.skipped++; return }

            await adminClient.from('usage_records').upsert(
              records.map(r => ({ ...r, key_id: key.id, user_id: key.user_id })),
              { onConflict: 'key_id,date,model' }
            )
            await adminClient
              .from('api_keys')
              .update({
                last_used:            new Date().toISOString(),
                consecutive_failures: 0,
                last_failure_reason:  null,
              })
              .eq('id', key.id)

            syncResults.success++
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[sync] Key ${key.id}:`, msg)
            syncResults.failed++

            const newFailures = (key.consecutive_failures ?? 0) + 1
            await adminClient.from('api_keys').update({
              consecutive_failures: newFailures,
              last_failure_reason:  msg.slice(0, 500),
              ...(msg.includes('401') || msg.includes('403') ? { is_valid: false } : {}),
            }).eq('id', key.id)

            // After 3 consecutive failures: create alert
            if (newFailures >= 3) {
              await adminClient.from('alerts').insert({
                user_id:    key.user_id,
                type:       'sync_failed',
                scope:      'key',
                scope_id:   key.id,
                scope_name: key.provider,
                title:      'Sync failing repeatedly',
                message:    `Could not sync usage data: ${msg.slice(0, 200)}`,
                severity:   'warning',
              })
            }
          }
        })
      )
    }
  }

  console.log('[sync] Complete:', syncResults)

  // ── STEP 2: CHECK BUDGETS ────────────────────────────────────────

  const { data: budgets } = await adminClient.from('budgets').select('*')
  const alertResults = { fired: 0, skipped: 0 }

  for (const budget of (budgets ?? [])) {
    try {
      const { checkBudget } = await import('@/lib/utils/budget-check')
      const fired = await checkBudget(budget)
      if (fired) alertResults.fired++
      else alertResults.skipped++
    } catch (err) {
      console.error(`[budgets] Budget ${budget.id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log('[budgets] Complete:', alertResults)
  return Response.json({ sync: syncResults, alerts: alertResults })
}

---

## daily-tasks route — full implementation

// /app/api/cron/daily-tasks/route.ts
// Runs every day at 7am UTC.

export const maxDuration = 300

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // ── STEP 1: OPENROUTER BALANCE DIFF ─────────────────────────────
  // Pattern 1 — only syncs daily
  try {
    const { syncOpenRouterKeys } = await import('@/lib/utils/openrouter-sync')
    results.openRouter = await syncOpenRouterKeys()
  } catch (err) {
    console.error('[daily] openrouter-sync failed:', err instanceof Error ? err.message : err)
    results.openRouter = 'failed'
  }

  // ── STEP 2: PRICE ALERTS ────────────────────────────────────────
  try {
    const { checkPriceChanges } = await import('@/lib/utils/price-check')
    results.priceAlerts = await checkPriceChanges()
  } catch (err) {
    console.error('[daily] price-alerts failed:', err instanceof Error ? err.message : err)
    results.priceAlerts = 'failed'
  }

  // ── STEP 3: WASTE DETECTION ─────────────────────────────────────
  try {
    const { detectWasteKeys } = await import('@/lib/utils/waste')
    results.wasteDetection = await detectWasteKeys()
  } catch (err) {
    console.error('[daily] waste-detection failed:', err instanceof Error ? err.message : err)
    results.wasteDetection = 'failed'
  }

  // ── STEP 4: ROTATION REMINDERS ──────────────────────────────────
  try {
    const { checkRotationDue } = await import('@/lib/utils/rotation')
    results.rotationReminders = await checkRotationDue()
  } catch (err) {
    console.error('[daily] rotation-reminders failed:', err instanceof Error ? err.message : err)
    results.rotationReminders = 'failed'
  }

  // ── STEP 5: MONTHLY REPORT — only on 1st of month ───────────────
  const today = new Date()
  if (today.getDate() === 1) {
    try {
      const { generateMonthlyReports } = await import('@/lib/utils/monthly-report')
      results.monthlyReport = await generateMonthlyReports()
    } catch (err) {
      console.error('[daily] monthly-report failed:', err instanceof Error ? err.message : err)
      results.monthlyReport = 'failed'
    }
  } else {
    results.monthlyReport = 'skipped — not 1st of month'
  }

  console.log('[daily-tasks] Complete:', results)
  return Response.json(results)
}

---

## next.config.ts — Production Configuration

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-Content-Type-Options',    value: 'nosniff' },
        { key: 'X-Frame-Options',           value: 'DENY' },
        { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" },
      ],
    }]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig

---

## Utility files needed by cron routes

/lib/utils/budget-check.ts    ← checkBudget(budget) — compares spend to budget, fires alerts
/lib/utils/price-check.ts     ← checkPriceChanges() — compares price_snapshots to yesterday
/lib/utils/monthly-report.ts  ← generateMonthlyReports() — sends report emails on 1st
/lib/utils/waste.ts           ← detectWasteKeys() — flags keys with no activity in 30+ days
/lib/utils/rotation.ts        ← checkRotationDue() — flags keys 80+ days old
/lib/utils/openrouter-sync.ts ← syncOpenRouterKeys() — balance diff for Pattern 1

---

## Sentry Integration

// Install: npm install @sentry/nextjs
// Wrap cron routes and webhook handler with Sentry to capture errors.
// Add to instrumentation.ts:

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn:              process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,   // 10% of requests traced — enough for debugging
  environment:      process.env.NODE_ENV,
})

// SENTRY_DSN goes in .env.local. Never commit it.
// Free tier handles 5,000 errors/month — enough for launch.
