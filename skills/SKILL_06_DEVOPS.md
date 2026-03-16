# Skill 06 — Infrastructure, Scale & DevOps
# Expert: DVO — DevOps & Scale Expert

I have built systems handling 10 million requests per day on infrastructure
that costs less than most people's rent. The secret is not spending money
on servers. It is designing your application to work with the grain of
your infrastructure, not against it.

---

## Why Vercel Handles 1 Lakh Users Without Configuration

Vercel uses Edge Network — your code runs in data centres closest to each user.
A user in Mumbai hits a Mumbai server. A user in London hits a London server.
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

## vercel.json — Place in project root alongside CLAUDE.md

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
  1. Fetches latest usage data from all platforms
  2. Checks all budgets against the freshly synced data

  Why 15 minutes and not faster:
  OpenAI's usage API updates every 5-15 minutes on their end.
  Anthropic is similar. Gemini has 24-48 hour delays regardless.
  AWS Cost Explorer updates once daily regardless.
  Polling every 1 minute would fetch identical data 14 times out of 15
  because the source has not changed. 15 minutes is the realistic
  minimum that produces new data. Faster polling wastes API calls.

  Why combine sync and budget check in one job:
  Budget check always needs fresh data to be accurate.
  Running budget check immediately after sync in the same route means
  alerts are always based on the latest numbers. Two separate jobs
  could result in budget check running on stale data if the schedules
  drift. One job eliminates this race condition entirely.

  User experience: dashboard data is never more than 15 minutes old.
  Budget alert emails arrive within 15 minutes of crossing a limit.
  This is genuinely fast enough — nobody needs sub-15-minute billing alerts.

daily-tasks every day at 7am (0 7 * * *):

  This single job does three things in sequence:
  1. Price change detection — compare today's platform prices to yesterday
  2. Waste detection — flag keys with no activity in 30+ days
  3. Monthly report — only runs on the 1st of the month (checked inside the code)

  Why combine into one daily job:
  All three are lightweight tasks that take 1-3 seconds each.
  Running them sequentially in one route is cleaner than three separate jobs
  and keeps us within the 2-cron free plan limit.

  Why 7am:
  Indian Standard Time friendly. Users see price change notifications
  and waste alerts at the start of their working day.
  Monthly reports arrive on the 1st of the month at a reasonable time.

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

## Combined Cron Route Implementations

// /app/api/cron/sync-and-check/route.ts
// Runs every 15 minutes.
// Step 1: sync usage data from all platforms.
// Step 2: check all budgets against fresh data.
// Both steps must complete within 300 seconds total.

export const maxDuration = 300

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }

  // ── STEP 1: SYNC USAGE ──────────────────────────────────────────

  const { data: keys } = await adminClient
    .from('api_keys')
    .select('id,user_id,provider,encrypted_key,endpoint_url')
    .eq('is_active', true)
    .eq('is_valid',  true)

  const syncResults = { success: 0, failed: 0, skipped: 0 }
  const BATCH_SIZE  = 10

  for (let i = 0; i < (keys?.length ?? 0); i += BATCH_SIZE) {
    const batch = keys!.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(
      batch.map(async (key) => {
        try {
          const { decrypt }    = await import('@/lib/encryption')
          const { fetchUsage } = await import('@/lib/platforms')
          const plainKey       = decrypt(key.encrypted_key)
          const today          = new Date().toISOString().split('T')[0]
          const weekAgo        = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
          const records        = await fetchUsage(key.provider, plainKey, weekAgo, today)

          if (records.length === 0) { syncResults.skipped++; return }

          await adminClient.from('usage_records').upsert(
            records.map(r => ({ ...r, key_id: key.id, user_id: key.user_id })),
            { onConflict: 'key_id,date,model' }
          )
          await adminClient
            .from('api_keys')
            .update({ last_used: new Date().toISOString() })
            .eq('id', key.id)

          syncResults.success++
        } catch (err) {
          console.error(`[sync] Key ${key.id}:`, err instanceof Error ? err.message : err)
          syncResults.failed++
          if (err instanceof Error && err.message.includes('401')) {
            await adminClient.from('api_keys').update({ is_valid: false }).eq('id', key.id)
          }
        }
      })
    )
  }

  console.log('[sync] Complete:', syncResults)

  // ── STEP 2: CHECK BUDGETS ────────────────────────────────────────
  // Runs immediately after sync so it always uses fresh data.

  const { data: budgets } = await adminClient
    .from('budgets')
    .select('*')

  const alertResults = { fired: 0, skipped: 0 }

  for (const budget of (budgets ?? [])) {
    try {
      // Calculate current spend for this budget's scope
      // (global / platform / project / key)
      // Compare against budget.amount_usd
      // If threshold crossed and not already alerted at this threshold:
      //   insert into alerts table
      //   send email via Resend
      //   update last_alerted_threshold on budget row
      // Implementation detail: the full budget checking logic lives in
      // /lib/utils/budget-check.ts — keep this route thin.
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


// /app/api/cron/daily-tasks/route.ts
// Runs every day at 7am IST.
// Combines: price alerts + waste detection + monthly report (1st only).

export const maxDuration = 300

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // ── PRICE ALERTS ────────────────────────────────────────────────
  try {
    const { checkPriceChanges } = await import('@/lib/utils/price-check')
    results.priceAlerts = await checkPriceChanges()
  } catch (err) {
    console.error('[daily] price-alerts failed:', err instanceof Error ? err.message : err)
    results.priceAlerts = 'failed'
  }

  // ── WASTE DETECTION ─────────────────────────────────────────────
  try {
    const { detectWasteKeys } = await import('@/lib/utils/waste')
    results.wasteDetection = await detectWasteKeys()
  } catch (err) {
    console.error('[daily] waste-detection failed:', err instanceof Error ? err.message : err)
    results.wasteDetection = 'failed'
  }

  // ── MONTHLY REPORT — only runs on 1st of month ──────────────────
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

## Folder Changes from Previous Version

Old routes (delete these — they no longer exist):
  /app/api/cron/sync-usage/route.ts
  /app/api/cron/check-budgets/route.ts
  /app/api/cron/price-alerts/route.ts
  /app/api/cron/waste-detection/route.ts
  /app/api/cron/monthly-report/route.ts

New routes (create these instead):
  /app/api/cron/sync-and-check/route.ts
  /app/api/cron/daily-tasks/route.ts

New utility files needed:
  /lib/utils/budget-check.ts    ← budget checking logic extracted here
  /lib/utils/price-check.ts     ← price change detection logic here
  /lib/utils/monthly-report.ts  ← monthly report generation logic here
  /lib/utils/waste.ts           ← already exists, no change needed

---

## BUILD_SESSIONS.md — Lines to Update

In Session 6 prompt change:
  OLD: Build /app/api/cron/check-budgets/route.ts
  NEW: Build the checkBudget() function in /lib/utils/budget-check.ts
       which is called by /app/api/cron/sync-and-check/route.ts

In Session 11 prompt change:
  OLD: Build /app/api/cron/waste-detection/route.ts
       Build /app/api/cron/price-alerts/route.ts
       Build /app/api/cron/monthly-report/route.ts
  NEW: Build /lib/utils/price-check.ts (checkPriceChanges function)
       Build /lib/utils/monthly-report.ts (generateMonthlyReports function)
       Build /app/api/cron/sync-and-check/route.ts (full combined route)
       Build /app/api/cron/daily-tasks/route.ts (full combined route)
       Delete the 5 old separate cron route files if they were created

In Session 15 prompt change:
  OLD: All cron routes check CRON_SECRET header before processing
  NEW: Both /api/cron/sync-and-check and /api/cron/daily-tasks check
       CRON_SECRET header. Verify both routes reject requests without it.