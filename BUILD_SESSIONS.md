# API Lens — Build Sessions

For each session: open terminal → cd into your project folder → type `claude` → paste the prompt below.

---

## BEFORE SESSION 1 — Complete this checklist first

- [ ] Create Supabase project at supabase.com → save URL + anon key + service role key
- [ ] Run SCHEMA.md in Supabase SQL Editor (paste entire file, click Run)
- [ ] Create Razorpay account → get Key ID and Secret → create monthly plan (₹415) and annual plan (₹4149)
- [ ] Create Resend account → verify your domain → get API key
- [ ] Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copy .env.example to .env.local and fill every value
- [ ] Create GitHub repo and push empty project

---

## SESSION 1 — Scaffold + Authentication

```
Read CLAUDE.md, PROJECT_STRUCTURE.md, skills/SKILL_01_ARCHITECTURE.md, and skills/SKILL_03_SECURITY.md completely.

Session 1: Scaffold the project and build authentication.

1. Create Next.js 15 project with TypeScript strict mode
2. Install all packages from the stack in CLAUDE.md
3. Set up Tailwind CSS v4 with design tokens from CLAUDE.md as CSS variables in globals.css
4. Initialize shadcn/ui with New York style and zinc base color
5. Set up next/font/google with Syne (400,500,600,700) and JetBrains Mono (400,500)
6. Create /lib/env.ts using the env validation pattern from skills/SKILL_03_SECURITY.md — app must crash with clear message if any env var is missing
7. Create all 3 Supabase clients using the pattern in skills/SKILL_01_ARCHITECTURE.md
8. Create middleware.ts — protect all /(app) routes, redirect unauthenticated to /login
9. Build /(auth)/login page — email + password, Google OAuth button, API Lens branding, dark theme
10. Build /(auth)/signup page — same style, add full name field
11. Build /(auth)/forgot-password page
12. Build /(app)/layout.tsx — sidebar (220px) with nav links for: Dashboard, Projects, Keys, Costs, Estimator, Budgets, Alerts, Reports, Settings. Use design tokens from CLAUDE.md exactly.
13. Build placeholder /dashboard/page.tsx so login redirect works

End result: npm run dev works, login and signup work, authenticated user sees sidebar.
```

---

## SESSION 2 — Encryption + API Key Management

```
Read CLAUDE.md, skills/SKILL_03_SECURITY.md, and skills/SKILL_01_ARCHITECTURE.md before starting.

Session 2: Encryption + API key CRUD for all 8 platforms.

1. Build /lib/encryption/index.ts using the EXACT encryption code from skills/SKILL_03_SECURITY.md
2. Build /lib/platforms/index.ts — registry of all 8 platforms with unified fetchUsage() and validateKey() functions
3. Build stub files for all 8 providers in /lib/platforms/ — each exports validateKey() (real implementation), fetchUsage() (stub returning empty array for now), and platformInfo with name/color/models
4. Build /lib/validations/key.ts — Zod schemas for adding and editing keys
5. Build /app/(app)/keys/actions.ts — Server Actions: addApiKey, updateApiKey, deleteApiKey using the Server Action pattern from skills/SKILL_01_ARCHITECTURE.md exactly
6. Build /components/app/keys/masked-key.tsx — shows "sk-...4f8b" format, never full key
7. Build /components/app/keys/key-status-badge.tsx — active (green), invalid (red), expiring (yellow), inactive (grey)
8. Build /components/app/keys/add-key-dialog.tsx — provider logo grid to select platform, nickname field, API key paste field with show/hide toggle, notes field, endpoint URL field shown only for azure and custom, validate button
9. Build /components/app/keys/key-list.tsx — TanStack Table with columns: provider logo, nickname, masked key, status badge, last used, monthly spend, rotation due, delete button
10. Build /app/(app)/keys/page.tsx — page header with Add Key button, key list with loading skeleton and empty state using patterns from skills/SKILL_04_FRONTEND.md

End result: Add a real API key → it validates → saves encrypted → appears masked in list → can be deleted.
```

---

## SESSION 3 — OpenAI Usage Data

```
Read CLAUDE.md, skills/SKILL_07_AI_PLATFORMS.md, and PLATFORMS.md section 1 before starting.

Session 3: Fetch real usage data from OpenAI.

1. Implement /lib/platforms/openai.ts fully — fetchUsage() calls OpenAI Admin API, calculates cost using price_snapshots table data, returns UsageRecord[]. validateKey() makes a test request to /v1/models.
2. Build /app/api/cron/sync-usage/route.ts — protected by CRON_SECRET header check. Fetches all active api_keys for all users. For each key: decrypt it, call fetchUsage() for the last 7 days, upsert results into usage_records table. Only processes OpenAI keys for now.
3. Build /hooks/use-usage.ts — TanStack Query hooks: useDailySpend(days), useSpendByPlatform(), useTotalMtd(), useTopKeys()
4. Build /components/app/charts/area-chart.tsx — Recharts AreaChart using design tokens, 30-day daily spend
5. Build /components/app/charts/bar-chart.tsx — horizontal bar for platform breakdown
6. Build /components/app/charts/sparkline.tsx — tiny inline trend line for stat cards
7. Build /components/app/shared/stat-card.tsx — KPI card with label, value (JetBrains Mono), delta indicator, optional sparkline
8. Build loading skeletons using the patterns from skills/SKILL_04_FRONTEND.md

End result: Add OpenAI key → run sync cron manually → usage_records populated → charts show real data.
```

---

## SESSION 4 — Global Dashboard

```
Read CLAUDE.md, skills/SKILL_02_DATABASE.md, and skills/SKILL_04_FRONTEND.md before starting.

Session 4: Complete global dashboard.

1. Build /components/app/dashboard/kpi-cards.tsx — 4 cards using stat-card component: Total Spend MTD, Projected Month-End, Budget Remaining %, Active Keys. Use Query 1 from skills/SKILL_02_DATABASE.md.
2. Build /components/app/dashboard/spend-chart.tsx — 30-day daily area chart using Query 2 from skills/SKILL_02_DATABASE.md. Include date range selector: This month / Last 7 days / Last 30 days.
3. Build /components/app/dashboard/platform-breakdown.tsx — horizontal bar using Query 3 from skills/SKILL_02_DATABASE.md.
4. Build /components/app/dashboard/top-keys-table.tsx — top 5 keys by spend, with provider logo, nickname, masked key, spend amount, % of total.
5. Build /components/app/dashboard/key-health-grid.tsx — all keys in a grid showing status badge.
6. Build /components/app/dashboard/recent-alerts-panel.tsx — 5 most recent alerts with severity icon and relative timestamp.
7. Build /components/app/dashboard/demo-banner.tsx — when user has zero keys, show realistic fake data with a yellow "Demo Mode — Add your first key to see real data" banner.
8. Build /components/app/layout/command-palette.tsx — ⌘K opens search dialog. Searchable items: Add Key, New Project, navigate to any page, recent alerts.
9. Build /app/(app)/dashboard/page.tsx — assemble all components with Suspense boundaries. Each section loads independently with its own skeleton.

End result: Dashboard shows real data. Demo mode works for new users. ⌘K opens command palette.
```

---

## SESSION 5 — Project Tracker

```
Read CLAUDE.md, skills/SKILL_02_DATABASE.md, and skills/SKILL_01_ARCHITECTURE.md before starting. This is a core feature — build it completely.

Session 5: Project-level cost tracking.

1. Build /lib/validations/project.ts — Zod schemas for create and update project
2. Build /app/(app)/projects/actions.ts — Server Actions: createProject, updateProject, deleteProject, assignKeysToProject, removeKeyFromProject
3. Build /hooks/use-projects.ts — useProjects(), useProject(id), useProjectSpend(id)
4. Build /components/app/projects/project-card.tsx — color swatch, name, description, key count, this-month spend, budget health bar
5. Build /components/app/projects/create-project-dialog.tsx — name field, description, 12-color picker, assign keys (searchable checklist of user's existing keys)
6. Build /components/app/projects/assign-keys-dialog.tsx — searchable list of all keys with checkboxes
7. Build /app/(app)/projects/page.tsx — project grid, create button, empty state, compare button to select 2-3 projects
8. Build /app/(app)/projects/[id]/page.tsx — full project detail page showing:
   - Project header with name, color, description, edit button
   - 4 KPI cards: project spend MTD, projected month-end, budget remaining, keys in project
   - Daily spend chart for THIS PROJECT ONLY (use Query 4 from skills/SKILL_02_DATABASE.md filtered by project)
   - Keys in project table with individual costs
   - Budget vs actual progress bar
   - Project-specific alerts section (independent from global)
9. Build /components/app/projects/compare-view.tsx — side by side cost comparison of selected projects

End result: Create project → assign keys → project detail shows that project's costs separate from global.
```

---

## SESSION 6 — Budgets + Email Alerts

```
Read CLAUDE.md, skills/SKILL_02_DATABASE.md, and skills/SKILL_06_DEVOPS.md before starting.

Session 6: Budget management + email alerts via Resend.

1. Build /lib/validations/budget.ts
2. Build /app/(app)/budgets/actions.ts — createBudget, updateBudget, deleteBudget
3. Build /lib/email/client.ts — Resend instance
4. Build all email templates using React Email in /lib/email/templates/: welcome.tsx, alert-budget.tsx, alert-spike.tsx, trial-ending.tsx, trial-expired.tsx, monthly-report.tsx, rotation-reminder.tsx
5. Build /app/api/cron/check-budgets/route.ts — protected by CRON_SECRET. For each user budget: calculate current spend vs budget amount. Fire alert at 50/75/90/100% thresholds. Only fire each threshold once (check last_alerted_threshold column). For each alert: insert into alerts table AND send email via Resend.
6. Build anomaly detection: after each usage sync, use Query 5 from skills/SKILL_02_DATABASE.md. If any key spikes 3× daily average, create spike alert + send email.
7. Build /components/app/budgets/budget-card.tsx — scope label, amount, spent, % ring progress bar, threshold toggles
8. Build /components/app/budgets/set-budget-dialog.tsx — scope selector (global/platform/project/key), scope picker (dropdown of platforms/projects/keys), amount, period, alert thresholds
9. Build /app/(app)/budgets/page.tsx — global budget at top, then platform budgets, project budgets, key budgets
10. Build /app/(app)/alerts/page.tsx — alert feed with filter by type and severity, mark all read button, unread badge count in sidebar

End result: Set budget below current spend → trigger cron → alert appears in UI and email arrives.
```

---

## SESSION 7 — Cost Estimator

```
Read CLAUDE.md and skills/SKILL_07_AI_PLATFORMS.md before starting.

Session 7: Pre-commitment cost calculator.

1. Build estimator form — provider selector, model selector (filtered by provider), messages/day slider, avg input tokens input, avg output tokens input, num users input, batch discount toggle. Calculation updates live as user types using estimateMonthlyUsd() from skills/SKILL_07_AI_PLATFORMS.md.
2. Build comparison table — same inputs applied to ALL models across ALL 8 platforms. Sorted cheapest first. Highlight cheapest in green. Show batch savings column where supported.
3. Build model swap suggestion — if user selected expensive model, show "💡 Switching to [cheaper model] saves you $X/month" card automatically using calculateModelSwapSavings() from skills/SKILL_07_AI_PLATFORMS.md.
4. Build cost per 1,000 requests metric displayed next to monthly estimate using costPer1000Requests() from skills/SKILL_07_AI_PLATFORMS.md.
5. Build save estimate dialog — estimate name, optional project link.
6. Build estimated vs actual tracker — table of saved estimates showing predicted vs real spend (real filled in monthly by cron).
7. Build /app/(app)/estimator/page.tsx — form on left, results on right (desktop). Stacked on mobile.

End result: Pick any platform and model, enter usage params, see projected cost and cross-platform comparison instantly.
```

---

## SESSION 8 — All 7 Named Platforms

```
Read CLAUDE.md and PLATFORMS.md before starting.

Session 8: Implement real fetchUsage() and validateKey() for all 7 named platforms.

1. /lib/platforms/anthropic.ts — full fetchUsage() using Anthropic Admin API + full validateKey()
2. /lib/platforms/gemini.ts — full implementation with Cloud Monitoring for tokens. Include detailed setup comment explaining service account creation steps.
3. /lib/platforms/aws.ts — full implementation with CloudWatch for tokens + Cost Explorer for cost. Include IAM permissions comment.
4. /lib/platforms/azure.ts — full implementation. Requires endpoint_url from api_keys table. Include setup comment.
5. /lib/platforms/mistral.ts — full implementation using Mistral usage history API
6. /lib/platforms/cohere.ts — full implementation using Cohere usage API
7. Update /app/api/cron/sync-usage/route.ts — process all 7 providers, not just OpenAI. Follow the cron pattern from skills/SKILL_06_DEVOPS.md.
8. Update add-key-dialog.tsx — show endpoint URL field for Azure, region selector for AWS, project ID field for Gemini. Show relevant help text per provider linking to docs.

End result: Add keys for multiple providers → run sync cron → all providers show data in dashboard.
```

---

## SESSION 9 — Custom Platforms

```
Read CLAUDE.md and PLATFORMS.md section 8 before starting.

Session 9: User-defined custom platforms.

1. Update add-key-dialog.tsx for custom provider — add fields: platform name, logo URL (optional), cost model selector (per-request or per-1k-tokens), cost amount in USD, base URL optional
2. Build /lib/platforms/custom.ts — no API call, manual entry only. validateKey() always returns valid = true with a note that custom platforms use manual entry.
3. Build "Log Usage" button on key detail page for custom keys — dialog: date picker, request count, token count optional, auto-calculated cost shown before saving, saves to usage_records
4. Ensure estimator shows custom platform option if user has custom keys, using the user's defined cost model

End result: Add custom API → manually log usage → appears in dashboard costs alongside other platforms.
```

---

## SESSION 10 — Razorpay Billing

```
Read CLAUDE.md and skills/SKILL_05_PAYMENTS.md before starting.
Prerequisites: Razorpay plans created in dashboard (monthly ₹415, annual ₹4149).

Session 10: Complete Razorpay subscription billing.

1. Build /lib/razorpay/client.ts — Razorpay SDK instance
2. Build /lib/razorpay/plans.ts — plan definitions using the PLANS object from skills/SKILL_05_PAYMENTS.md: monthly ₹415 (~$4.99 USD) and annual ₹4149 (~$49.99 USD)
3. Build /lib/razorpay/helpers.ts — createSubscription(userId, planId), getSubscriptionStatus(userId), isSubscribed(userId)
4. Build /app/api/webhooks/razorpay/route.ts using the EXACT webhook handler from skills/SKILL_05_PAYMENTS.md
5. Build subscription middleware — check plan before allowing /(app) routes. Trial users get full access. Expired users see read-only dashboard with upgrade CTA.
6. Build trial status bar — shown in topbar during trial: "X days left in your trial — Upgrade now"
7. Build /app/(app)/settings/billing/page.tsx — current plan, next billing date shown in both INR and USD, payment history, cancel button with confirmation
8. Build /app/(marketing)/pricing/page.tsx — monthly vs annual comparison, 7-day trial highlight, feature list, FAQ
9. Build upgrade flow — trial expired → blur overlay on dashboard → pricing CTA → Razorpay checkout modal → webhook activates → full access

End result: Complete billing cycle works: signup → trial → upgrade → active subscription.
```

---

## SESSION 11 — Advanced Alerts

```
Read CLAUDE.md, skills/SKILL_06_DEVOPS.md, and skills/SKILL_02_DATABASE.md before starting.

Session 11: Full advanced alert system.

1. Build /app/api/cron/waste-detection/route.ts — daily. Find keys with last_used < 30 days ago that previously had usage. Create waste alerts. Send rotation-reminder emails via Resend. Follow cron pattern from skills/SKILL_06_DEVOPS.md.
2. Build key rotation alerts — daily check. Keys where rotation_due < now + 10 days get rotation alerts. Build /components/app/keys/key-rotation-banner.tsx shown on key detail pages.
3. Build provider status feed — fetch from OpenAI/Anthropic/Google status APIs every 5 minutes. Show outage banner in topbar when active provider has incident.
4. Build /app/api/cron/price-alerts/route.ts — daily. Compare latest price_snapshots to previous day. If any price changed, insert new snapshot and create price_change alert with old/new price in metadata.
5. Build /app/api/cron/monthly-report/route.ts — runs 1st of month. Per user: total spend, vs last month, biggest platform, biggest project, savings opportunity. Send monthly-report email. Store shareable link.
6. Build /app/(app)/settings/notifications/page.tsx — toggle matrix for each alert type × email delivery.

End result: Every alert type fires correctly. Email is received for each type.
```

---

## SESSION 12 — Settings + Reports

```
Read CLAUDE.md and skills/SKILL_03_SECURITY.md before starting.

Session 12: Settings screens and reports.

1. Build /app/(app)/settings/profile/page.tsx — full name, avatar upload to Supabase Storage, timezone selector
2. Build /app/(app)/settings/security/page.tsx — change password, active sessions with revoke button, 2FA toggle
3. Build /app/(app)/settings/team/page.tsx — invite collaborator by email, list current members, remove access
4. Build /app/(app)/reports/page.tsx — list of monthly report cards. Each shows: month, total spend, vs prior month arrow, biggest platform, shareable link button.
5. Build data export — CSV download of all usage_records. Available in settings.
6. Build account deletion in settings danger zone — confirmation dialog → deletes all user data → signs out

End result: All settings save correctly. Reports list shows. CSV export downloads with real data.
```

---

## SESSION 13 — Landing Page

```
Read CLAUDE.md, PRD.md, and skills/SKILL_04_FRONTEND.md before starting.

Session 13: Marketing landing page.

Build /app/(marketing)/page.tsx with these sections in order:
1. Navbar — API Lens logo, Features/Pricing/Security links, Login button, Start Free Trial button
2. Hero — headline "See exactly what your APIs are costing you", subheadline explaining the product, product screenshot (use the dashboard design), two CTAs
3. Platform logos strip — "Works with" + logos for all 8 platforms
4. Problem section — 3 pain points with icons: "Keys scattered everywhere", "Surprise bills every month", "No idea which project costs what"
5. Features — 4 cards: Global Dashboard, Project Tracker, Cost Estimator, Budget Alerts
6. How it works — 3 numbered steps with illustrations
7. Pricing — monthly ₹415 (~$4.99 USD) vs annual ₹4149 (~$49.99 USD), 7-day trial badge, feature list, FAQ accordion
8. Final CTA — "Start your 7-day free trial. No commitment."
9. Footer — links, Privacy Policy, Terms of Service

Also build:
- /app/(marketing)/security/page.tsx — explain AES-256-GCM, masked keys, no plaintext storage
- Basic /privacy/page.tsx and /terms/page.tsx with proper content

End result: Professional marketing site that converts visitors to signups.
```

---

## SESSION 14 — Polish

```
Read CLAUDE.md and skills/SKILL_04_FRONTEND.md before starting. No new features — quality only.

Session 14: Final polish.

Go through every page and fix:
1. Missing loading skeletons — every data-fetching area must have one using patterns from skills/SKILL_04_FRONTEND.md
2. Missing empty states — every list and table must have one using EmptyState component from skills/SKILL_04_FRONTEND.md
3. Missing error states — every data fetch must handle errors gracefully
4. Missing confirm dialogs — delete key, delete project, cancel subscription, delete account
5. Mobile responsiveness — test every page at 375px width and fix layout issues using responsive patterns from skills/SKILL_04_FRONTEND.md
6. Keyboard shortcuts — verify ⌘K (command palette), ⌘N (new key), ⌘P (new project) all work
7. Page transitions — add Framer Motion fade between routes
8. TypeScript — run npx tsc --noEmit and fix every error until zero remain
9. Accessibility — every button has aria-label, every image has alt, every form input has label
10. Dark and light mode — verify every component looks correct in both modes
11. Numbers — verify every number uses tabular-nums CSS class and formatUsd() from skills/SKILL_07_AI_PLATFORMS.md format utilities section

End result: Zero TypeScript errors, zero console warnings, works on mobile, both themes correct.
```

---

## SESSION 15 — Pre-launch

```
Read CLAUDE.md, skills/SKILL_06_DEVOPS.md, and skills/SKILL_03_SECURITY.md before starting.

Session 15: Launch readiness.

Check and implement each item:

Security:
- Security headers in next.config.ts using the configuration from skills/SKILL_06_DEVOPS.md: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- Rate limiting on login (5/15min per IP) and key creation (20/hr per user)
- All cron routes check CRON_SECRET header before processing
- Razorpay webhook signature verified (already done in session 10 — verify it is correct)

Legal pages:
- /privacy — privacy policy covering: data collected, API key encryption, third parties (Supabase, Razorpay, Resend), data deletion, GDPR rights
- /terms — terms of service covering: subscription terms, trial terms, cancellation, liability

Infrastructure:
Infrastructure:
- npm run build passes with zero errors
- Verify vercel.json exists in project root with exactly 2 cron jobs as defined in skills/SKILL_06_DEVOPS.md
- Deploy to Vercel
- All environment variables added to Vercel dashboard
- Confirm production URL loads correctly
End result: Print a final checklist with ✅ or ❌ for each item.
```
