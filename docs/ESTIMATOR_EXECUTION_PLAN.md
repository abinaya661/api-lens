# Cost Estimator Overhaul — Execution Plan

**Owner:** Engineering
**Date:** March 28, 2026
**Status:** Ready for Development
**Priority:** P1
**Estimated Effort:** 10 tasks across 3 sprints

---

## 1. Objective

Replace the current basic cost estimator (384-line monolith that multiplies tokens × price for 31 outdated models) with a production-grade **Smart Estimator** that:

1. **Compares ~85 models** across 7 providers (OpenAI, Anthropic, Gemini, Grok, DeepSeek, Moonshot, ElevenLabs) — filterable by use case (text, reasoning, image, audio, video, code, embedding)
2. **Forecasts** project-level and company-level month-end spend using weighted moving average on real usage data
3. **Auto-updates pricing** every 2 weeks via cron — adds new models, updates prices, removes deprecated ones

---

## 2. Providers & Model Count

| Provider | Models | Categories Covered |
|----------|--------|--------------------|
| OpenAI | ~30 | text, reasoning, code, image, audio, video, embedding |
| Anthropic | 12 | text |
| Google Gemini | 16 | text, image, video, audio, embedding |
| xAI (Grok) | 10 | text, reasoning, code, image, video |
| DeepSeek | 2 | text, reasoning |
| Moonshot (Kimi) | 3 | text |
| ElevenLabs | 4 | audio (TTS + STT) |
| **Total** | **~85** | **7 categories** |

**Excluded:** OpenRouter (marketplace, no fixed pricing), Azure OpenAI (duplicates OpenAI), AWS Bedrock, Cohere, Mistral (not in current adapter list).

---

## 3. Architecture

### Page Structure

```
/estimator
├── PageHeader "Cost Estimator"
└── Tabs (shadcn/ui @radix-ui/react-tabs)
    ├── [Compare Models] ← default tab
    │   ├── Left Panel (1/3)
    │   │   ├── Use Case Selector (7 category pills)
    │   │   ├── Dynamic Input Panel (adapts per category)
    │   │   ├── Sort Control (Cheapest / Capable / Best Value)
    │   │   └── Best Value Recommendation Card
    │   └── Right Panel (2/3)
    │       ├── Provider Filter Tabs (7 providers + "All")
    │       └── Model Card Grid (pinnable, sortable)
    │
    └── [Forecast]
        ├── Metrics Row (4 StatCards)
        ├── Company Forecast Chart (actual + projected + confidence)
        ├── Provider Breakdown
        └── Project Section (dropdown → per-project forecasts)
```

### Data Flow

```
price_snapshots (Supabase) → getPriceSnapshots(category?) → usePriceSnapshots() → Compare Tab
usage_records (Supabase) → getCompanyForecast() → useCompanyForecast() → Forecast Tab
Bi-weekly cron → fetch provider pages → update price_snapshots → email admin summary
```

---

## 4. Task Breakdown

### Task 1: Database Migration
**Sprint:** 1
**Assignee:** Backend
**File:** `supabase/migrations/009_estimator_overhaul.sql`
**Depends on:** Nothing

**Instructions:**

1. Add new columns to `price_snapshots`:

```sql
ALTER TABLE public.price_snapshots
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS capability_score SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_window INTEGER,
  ADD COLUMN IF NOT EXISTS supports_batch BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS batch_input_per_mtok NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS batch_output_per_mtok NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS cached_input_per_mtok NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS image_prices JSONB,
  ADD COLUMN IF NOT EXISTS per_unit_price NUMERIC(12,6);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_category ON public.price_snapshots(category);
```

2. Delete out-of-scope providers:
```sql
DELETE FROM public.price_snapshots WHERE provider IN ('azure_openai', 'bedrock', 'cohere', 'mistral');
```

3. Update existing OpenAI models with capability scores and verify prices match current official pricing.

4. Insert all new models. The complete model data is in **Section 8** of this document. Use `ON CONFLICT (provider, model) DO UPDATE` to handle re-runs safely.

**Acceptance Criteria:**
- [ ] ~85 rows in price_snapshots across 7 providers
- [ ] Every row has correct `category`, `capability_score`, pricing fields
- [ ] Image models have `image_prices` JSONB populated
- [ ] Audio/video models have `per_unit_price` populated
- [ ] Deprecated models (Gemini 2.0 Flash, Claude Opus 3, Sonnet 3.7) have `is_deprecated = true`

---

### Task 2: Type Updates
**Sprint:** 1
**Assignee:** Backend
**Files:** `types/database.ts`, `types/api.ts`
**Depends on:** Task 1 (schema must be defined)

**Instructions:**

1. Update `PriceSnapshot` in `types/database.ts`:

```typescript
export interface PriceSnapshot {
  id: string;
  provider: string;
  model: string;
  model_display: string | null;
  input_per_mtok: number;
  output_per_mtok: number;
  unit_type: string;
  unit_display: string;
  batch_discount: number | null;
  supports_caching: boolean | null;
  captured_at: string;
  // NEW FIELDS:
  category: string;
  capability_score: number;
  is_deprecated: boolean;
  context_window: number | null;
  supports_batch: boolean;
  batch_input_per_mtok: number | null;
  batch_output_per_mtok: number | null;
  cached_input_per_mtok: number | null;
  image_prices: ImagePricingTier[] | null;
  per_unit_price: number | null;
}
```

2. Add new types to `types/api.ts`:

```typescript
export type UseCaseCategory = 'text' | 'reasoning' | 'image' | 'audio' | 'video' | 'code' | 'embedding';

export interface ImagePricingTier {
  quality: string;     // 'low', 'medium', 'high', 'standard', 'hd', 'ultra', 'fast'
  resolution: string;  // '1024x1024', '1792x1024', 'standard', etc.
  price: number;       // USD per image
}

export interface ForecastDataPoint {
  date: string;        // YYYY-MM-DD
  actual: number;      // actual spend (0 for future days)
  forecast: number | null;  // projected spend (null for past days)
}

export interface ProjectForecast {
  project_id: string;
  project_name: string;
  current_spend: number;
  forecast_month_end: number;
  confidence_low: number;
  confidence_high: number;
  daily_data: ForecastDataPoint[];
  by_provider: PlatformSpend[];
  by_model: { model: string; provider: string; spend: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CompanyForecast {
  current_spend: number;
  forecast_month_end: number;
  confidence_low: number;
  confidence_high: number;
  daily_data: ForecastDataPoint[];
  by_project: ProjectForecast[];
  unassigned_spend: number;
  by_provider: PlatformSpend[];
  budget_amount: number | null;
  budget_utilization_pct: number | null;
}
```

**Acceptance Criteria:**
- [ ] `pnpm tsc --noEmit` passes with no errors
- [ ] All new types are exported

---

### Task 3: Forecasting Engine
**Sprint:** 1
**Assignee:** Backend
**File:** `lib/forecasting/index.ts` (new)
**Depends on:** Task 2

**Instructions:**

Create a pure TypeScript module (no React, no Supabase imports). Must be testable independently.

**Function 1: `weightedMovingAverageForecast`**

```typescript
interface DailyAmount { date: string; amount: number; }

export function weightedMovingAverageForecast(
  dailySpend: DailyAmount[],
  daysInMonth: number,
  decayFactor?: number,  // default 0.85
): {
  forecast: number;
  confidenceLow: number;
  confidenceHigh: number;
  weightedDailyAvg: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}
```

Algorithm:
1. Sort `dailySpend` by date ascending
2. If < 3 data points, fall back to simple linear: `(sum / count) * daysInMonth`
3. Assign weights: `weight[i] = decay^(n - 1 - i)` where `i=0` is oldest, `i=n-1` is most recent (weight = 1.0)
4. `weightedDailyAvg = Σ(weight_i × amount_i) / Σ(weight_i)`
5. `remainingDays = daysInMonth - n`
6. `forecast = totalCurrentSpend + (weightedDailyAvg × remainingDays)`
7. Compute weighted standard deviation of amounts against weighted average
8. `confidenceLow = max(totalCurrentSpend, forecast - 1.96 × stdDev × √remainingDays)`
9. `confidenceHigh = forecast + 1.96 × stdDev × √remainingDays`
10. **Trend:** Split data into two halves. Compare weighted avg of recent half vs older half. If diff > 5% = 'increasing' or 'decreasing', else 'stable'

**Function 2: `generateForecastSeries`**

```typescript
export function generateForecastSeries(
  dailySpend: DailyAmount[],
  daysInMonth: number,
  year: number,
  month: number,  // 0-indexed
  decayFactor?: number,
): ForecastDataPoint[]
```

Returns array of `{ date, actual, forecast }` for every day of the month:
- Past days (with data): `actual = amount`, `forecast = null`
- Past days (no data, gaps): `actual = 0`, `forecast = null`
- Future days: `actual = 0`, `forecast = weightedDailyAvg`

**Testing:** Create `tests/forecasting.test.ts` with cases:
- Constant daily spend → forecast = same daily × remaining
- Increasing spend → forecast higher than linear
- Decreasing spend → forecast lower than linear
- 1 day of data → falls back to linear
- 0 days → returns all zeros
- Full month (day 30/31) → forecast = current spend, confidence tight

**Acceptance Criteria:**
- [ ] Both functions exported and typed
- [ ] Unit tests pass (`pnpm test`)
- [ ] No React/Supabase dependencies

---

### Task 4: Server Actions
**Sprint:** 1
**Assignee:** Backend
**Files:** `lib/actions/estimator.ts` (new), `lib/actions/dashboard.ts` (modify), `lib/pricing/index.ts` (modify)
**Depends on:** Tasks 2, 3

**Instructions:**

**4a. Create `lib/actions/estimator.ts`:**

```typescript
'use server';

export async function getCompanyForecast(): Promise<ActionResult<CompanyForecast>> {
  // 1. Auth: const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  // 2. Get company_id from user's company
  // 3. Get month boundaries (1st of month to today, using user timezone from profile)
  // 4. Query usage_records for company_id, this month, group by date → daily_spend[]
  // 5. Query usage_records group by provider → by_provider[]
  // 6. Get all projects for company. For each project:
  //    a. Get key IDs: api_keys WHERE project_id = project.id → key_ids
  //    b. Query usage_records WHERE key_id IN key_ids, group by date → project daily_spend
  //    c. Run weightedMovingAverageForecast on project data
  //    d. Build ProjectForecast
  // 7. Get unassigned keys (api_keys WHERE project_id IS NULL), aggregate their usage
  // 8. Get global budget: budgets WHERE scope = 'global'
  // 9. Run weightedMovingAverageForecast on aggregate daily data
  // 10. Return CompanyForecast
}

export async function getProjectForecast(projectId: string): Promise<ActionResult<ProjectForecast>> {
  // 1. Auth + verify project belongs to user's company
  // 2. Get project name
  // 3. Get key_ids from api_keys WHERE project_id
  // 4. Query usage_records WHERE key_id IN key_ids, this month
  // 5. Group by date, by provider, by model
  // 6. Run forecast
  // 7. Return ProjectForecast
}
```

Follow the exact patterns in `lib/actions/dashboard.ts` — same auth flow, same `createClient()`, same `ActionResult<T>` return type.

**4b. Modify `lib/actions/dashboard.ts`:**

Update `getPriceSnapshots` to accept optional filters:

```typescript
export async function getPriceSnapshots(
  category?: string,
  includeDeprecated?: boolean,
): Promise<ActionResult<PriceSnapshot[]>> {
  const supabase = createAdminClient();
  let query = supabase.from('price_snapshots').select('*');
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (!includeDeprecated) {
    query = query.eq('is_deprecated', false);
  }
  const { data, error } = await query.order('provider').order('model');
  // ...
}
```

**4c. Modify `lib/pricing/index.ts`:**

Add two functions:

```typescript
export function calculateCostWithBatch(
  inputTokens: number,
  outputTokens: number,
  pricing: PriceSnapshot,
): number {
  const inputCost = (inputTokens / 1_000_000) * (pricing.batch_input_per_mtok ?? pricing.input_per_mtok);
  const outputCost = (outputTokens / 1_000_000) * (pricing.batch_output_per_mtok ?? pricing.output_per_mtok);
  return Math.round((inputCost + outputCost) * 1e6) / 1e6;
}

export function calculateCostWithCache(
  inputTokens: number,
  outputTokens: number,
  pricing: PriceSnapshot,
): number {
  const inputCost = (inputTokens / 1_000_000) * (pricing.cached_input_per_mtok ?? pricing.input_per_mtok);
  const outputCost = (outputTokens / 1_000_000) * pricing.output_per_mtok;
  return Math.round((inputCost + outputCost) * 1e6) / 1e6;
}
```

**Acceptance Criteria:**
- [ ] `getCompanyForecast()` returns valid data when usage_records exist
- [ ] `getCompanyForecast()` returns graceful empty state when no usage data
- [ ] `getPriceSnapshots('image')` returns only image category models
- [ ] `getPriceSnapshots('text', true)` includes deprecated models
- [ ] `pnpm build` passes

---

### Task 5: Pricing Auto-Update System
**Sprint:** 2
**Assignee:** Backend
**Files:** `app/api/cron/price-update/route.ts` (new), `app/api/admin/pricing/route.ts` (new), `vercel.json` (modify)
**Depends on:** Task 1

**Instructions:**

**5a. Cron Job: `app/api/cron/price-update/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // 1. Verify CRON_SECRET header
  // 2. For each provider, attempt to fetch their pricing page:
  //    - OpenAI: fetch('https://developers.openai.com/api/docs/pricing')
  //    - Anthropic: fetch('https://platform.claude.com/docs/en/about-claude/pricing')
  //    - Google: fetch('https://ai.google.dev/gemini-api/docs/pricing')
  //    - xAI: fetch('https://docs.x.ai/docs/models')
  //    - DeepSeek: fetch('https://api-docs.deepseek.com/quick_start/pricing')
  //    - Moonshot: fetch('https://platform.moonshot.ai/docs/pricing/chat')
  //    - ElevenLabs: fetch('https://elevenlabs.io/pricing/api')
  // 3. Parse HTML/markdown for pricing tables (provider-specific parsers)
  // 4. Compare against current price_snapshots
  // 5. Update changed prices (SET input_per_mtok, output_per_mtok, captured_at = NOW())
  // 6. Insert new models not in DB
  // 7. Flag models no longer on provider page as is_deprecated = true
  // 8. Send admin summary email via Resend:
  //    Subject: "API Lens Price Update — [date]"
  //    Body: X prices updated, Y new models, Z deprecated, W parse failures
  // 9. Return { updated, added, deprecated, errors }
}
```

**Important:** Some provider pages may not be easily parseable. For those, the cron should:
- Log the failure
- Include it in the admin email as "manual review needed"
- Not crash or skip other providers

**5b. Admin API: `app/api/admin/pricing/route.ts`**

```typescript
// GET: List all price_snapshots (admin view with stale indicators)
// PUT: Bulk update prices
//   Body: [{ provider, model, input_per_mtok, output_per_mtok, ...otherFields }]
//   Resets captured_at = NOW(), is_deprecated = false
// POST: Add new model(s)
//   Body: [{ provider, model, model_display, category, ...allFields }]
// Auth: CRON_SECRET header (same pattern as /api/admin/discounts)
```

**5c. Add to `vercel.json`:**
```json
{
  "path": "/api/cron/price-update",
  "schedule": "0 9 1,15 * *"
}
```

**Acceptance Criteria:**
- [ ] Cron executes without error when called with correct CRON_SECRET
- [ ] Admin GET returns all models with current pricing
- [ ] Admin PUT updates prices and resets captured_at
- [ ] Admin POST adds new models
- [ ] Summary email sends via Resend
- [ ] Parse failures don't crash the cron

---

### Task 6: React Query Hooks
**Sprint:** 2
**Assignee:** Frontend
**File:** `hooks/use-estimator.ts` (new)
**Depends on:** Task 4

**Instructions:**

Follow the exact pattern from `hooks/use-dashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getCompanyForecast, getProjectForecast } from '@/lib/actions/estimator';
import { getPriceSnapshots } from '@/lib/actions/dashboard';

export function useCompanyForecast() {
  return useQuery({
    queryKey: ['estimator', 'company-forecast'],
    queryFn: async () => {
      const result = await getCompanyForecast();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });
}

export function useProjectForecast(projectId: string) {
  return useQuery({
    queryKey: ['estimator', 'project-forecast', projectId],
    queryFn: async () => {
      const result = await getProjectForecast(projectId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!projectId,
  });
}

export function usePriceSnapshots(category?: string) {
  return useQuery({
    queryKey: ['price-snapshots', category ?? 'all'],
    queryFn: async () => {
      const result = await getPriceSnapshots(category);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}
```

**Acceptance Criteria:**
- [ ] All 3 hooks export correctly
- [ ] Loading/error states work
- [ ] Category filter triggers refetch with new queryKey

---

### Task 7: Compare Tab — Use Case Selector & Input Panel
**Sprint:** 2
**Assignee:** Frontend
**Files:** `components/estimator/use-case-selector.tsx`, `components/estimator/comparison-input-panel.tsx`
**Depends on:** Task 6

**Instructions:**

**7a. Use Case Selector (`use-case-selector.tsx`):**

7 pill buttons, each with a Lucide icon. Active pill has `ring-1 ring-brand-500/30 bg-zinc-800`. Use the existing tab styling from the current estimator page.

```
Text/Chat (MessageSquare) | Reasoning (Brain) | Image (ImageIcon) |
Audio (Volume2) | Video (Video) | Code (Code) | Embedding (Database)
```

Props: `{ selected: UseCaseCategory; onSelect: (cat: UseCaseCategory) => void }`

**7b. Dynamic Input Panel (`comparison-input-panel.tsx`):**

This is the most complex component. It must **adapt its inputs based on the selected category**:

| Category | Input Fields | Calculation |
|----------|-------------|-------------|
| `text` | Messages/day, Words/message, Output ratio (%) **OR** Monthly input tokens, Monthly output tokens (toggle between modes) | words × 1.3 × msgs × 30 = monthly input tokens; output = input × ratio |
| `reasoning` | Same as text **+** "Reasoning overhead" slider (2x to 10x, default 3x). Tooltip: "Reasoning models use hidden thinking tokens that multiply output cost" | Same as text but output tokens multiplied by overhead factor |
| `image` | Images/day, Quality dropdown (options from model's `image_prices` JSONB), Resolution dropdown (from `image_prices`) | images_per_day × 30 × price_per_image (from selected quality/resolution tier) |
| `audio` (TTS) | Words/day **OR** Characters/day (toggle). 1 word ≈ 5 characters | chars_per_day × 30 = monthly chars; monthly_chars / 1000 × price_per_1K |
| `audio` (STT) | Minutes of audio/day | mins × 30 × price_per_minute |
| `video` | Seconds of video/day, Quality dropdown (Standard/Fast/Pro if applicable) | seconds × 30 × price_per_second |
| `code` | Same inputs as `text` | Same calculation |
| `embedding` | Documents/day, Avg tokens per document | docs × tokens × 30 = monthly tokens; only input cost (no output) |

**Each mode always shows:**
- **Per-day cost** (updates real-time)
- **Per-month cost** (×30)
- **Per-year estimate** (×365)

**Additional controls:**
- "Apply Batch Pricing" toggle → uses `batch_input_per_mtok` / `batch_output_per_mtok`
- "Apply Cache Pricing" toggle → uses `cached_input_per_mtok` for input

**Monthly token summary** (bottom of panel):
```
Monthly Estimate
5.85M in → 1.76M out
tokens per month
```

Use the same styling as the current estimator's input panel: `glass-card p-6 space-y-5`, same input classes, same label styles.

**Acceptance Criteria:**
- [ ] Selecting "image" shows images/day + quality + resolution dropdowns
- [ ] Selecting "audio" shows characters/day or minutes/day
- [ ] Selecting "video" shows seconds/day
- [ ] Batch toggle changes costs to batch pricing
- [ ] Cache toggle changes input costs to cached pricing
- [ ] Daily, monthly, and yearly costs all update in real time

---

### Task 8: Compare Tab — Model Grid & Cards
**Sprint:** 2
**Assignee:** Frontend
**Files:** `components/estimator/model-card.tsx`, `components/estimator/model-comparison-grid.tsx`, `components/estimator/compare-tab.tsx`
**Depends on:** Tasks 6, 7

**Instructions:**

**8a. Model Card (`model-card.tsx`):**

Each card displays:
```
┌──────────────────────────────────────────┐
│ [OPENAI] badge              [Pin 📌]      │
│ GPT-5.4                    [Reasoning]   │
│ ────────────────────────────────────────  │
│ Capability: ██████████░░░░ 8/10          │
│ Context: 1M tokens                        │
│                                           │
│ $847.50 /month                            │
│ $28.25 /day                               │
│                                           │
│ Input: $2.50/M  Output: $15.00/M         │
│ Batch: $1.25/M → $7.50/M  [50% off]     │
│ Cache: $0.25/M input                      │
│                                           │
│ [⚠️ Deprecated] (if applicable)           │
└──────────────────────────────────────────┘
```

For **image models**, the card shows:
```
│ $1.26 /month  (42 images/day × $0.042)   │
│ $0.042 /image (Medium, 1024×1024)         │
```

For **audio models**:
```
│ $5.40 /month                               │
│ $0.06 /1,000 characters                    │
```

For **video models**:
```
│ $36.00 /month  (4 sec/day × $0.30)        │
│ $0.30 /second                              │
```

**Capability bar:** 10 small rounded segments. Filled segments use `bg-brand-500`, empty use `bg-zinc-800`. Shows score as "8/10" text.

**Pin feature:** Click pin icon → card moves to top of grid and stays there. Allows user to pin 2-3 models for side-by-side comparison. Pinned cards have `ring-2 ring-amber-500/40`.

Props: `{ model: ModelComparisonEntry; pinned: boolean; onPin: () => void; isTopResult: boolean; sortMode: string }`

**8b. Model Comparison Grid (`model-comparison-grid.tsx`):**

- Receives `snapshots`, `pTokens`, `cTokens` (or per-unit values), `category`, `sortMode`, `activeProvider`, `useBatch`, `useCache`
- Computes costs for each model using `useMemo`
- Sorts by selected mode (cheapest / capable / value)
- Filters by active provider
- Renders pinned cards at top, then sorted remaining cards
- If no models for selected category/provider: show `EmptyState`

**Sort modes:**
- **Cheapest:** total monthly cost ascending
- **Most Capable:** `capability_score` descending, then cost ascending as tiebreaker
- **Best Value:** `capability_score / (total_cost + 0.01)` descending (quality per dollar)

**8c. Compare Tab Container (`compare-tab.tsx`):**

Assembles: UseCaseSelector + ComparisonInputPanel (left), ProviderFilterTabs + ModelComparisonGrid (right)

Provider filter tabs: "All" + one tab per provider that has models in the selected category. Use the `PROVIDER_LABEL` map for display names. Include all 7 providers.

**Acceptance Criteria:**
- [ ] Text category: all text models from all providers shown with token costs
- [ ] Image category: shows per-image costs, quality/resolution visible
- [ ] Audio: per-character or per-minute costs
- [ ] Video: per-second costs
- [ ] Sort: Cheapest → cheapest first, Capable → highest score first, Value → best ratio first
- [ ] Pin 2 models → they stay at top, highlighted
- [ ] Provider tabs filter correctly
- [ ] Best Value recommendation card highlights top result with savings vs most expensive

---

### Task 9: Forecast Tab
**Sprint:** 3
**Assignee:** Frontend
**Files:** `components/estimator/forecast-metrics.tsx`, `components/estimator/forecast-chart.tsx`, `components/estimator/project-forecast-card.tsx`, `components/estimator/project-selector.tsx`, `components/estimator/forecast-tab.tsx`
**Depends on:** Tasks 4, 6

**Instructions:**

**9a. Forecast Metrics (`forecast-metrics.tsx`):**

4 StatCards in a grid row (reuse `components/shared/stat-card.tsx`):

| Card | Title | Value | Format | Icon |
|------|-------|-------|--------|------|
| 1 | Spend This Month | `current_spend` | currency | DollarSign |
| 2 | Projected Month-End | `forecast_month_end` | currency + trend arrow | TrendingUp |
| 3 | Confidence Range | `"$low — $high"` | none (formatted string) | ArrowLeftRight |
| 4 | Budget Status | `budget_utilization_pct`% or "No budget" | percentage or none | Shield |

Trend on card 2: use `trend` field from CompanyForecast. If increasing → red arrow, decreasing → green arrow, stable → gray dash.

**9b. Forecast Chart (`forecast-chart.tsx`):**

Follow the exact Recharts pattern from `components/dashboard/cost-chart.tsx`:

```tsx
<AreaChart data={forecastSeries}>
  {/* Actual spend: solid blue area */}
  <Area dataKey="actual" stroke="#3b82f6" fill="url(#actualGradient)" />

  {/* Forecasted spend: dashed blue area */}
  <Area dataKey="forecast" stroke="#3b82f6" strokeDasharray="5 5" fill="url(#forecastGradient)" />

  {/* Confidence band: light shaded area (optional, for polish) */}
  <Area dataKey="confidenceHigh" stroke="none" fill="rgba(59,130,246,0.1)" />
  <Area dataKey="confidenceLow" stroke="none" fill="white" />

  {/* Vertical "today" reference line */}
  <ReferenceLine x={today} stroke="#71717a" strokeDasharray="3 3" />
</AreaChart>
```

Custom tooltip: Show "Actual: $X" for past days, "Projected: $X" for future days.

**9c. Project Forecast Card (`project-forecast-card.tsx`):**

Compact card per project:
```
┌──────────────────────────────────────┐
│ 🟢 Project Name          ↗ +12%     │
│ Current: $142.50   Projected: $285  │
│ ▁▂▃▄▅▆▇█ (mini sparkline)          │
└──────────────────────────────────────┘
```

Mini sparkline: Use a tiny inline `<AreaChart>` (50px wide, 20px tall, no axes) from Recharts showing the daily_data trend.

**9d. Project Selector (`project-selector.tsx`):**

Use `components/ui/select.tsx`:
- Option "All Projects" (default)
- Options for each project in `by_project[]`
- When specific project selected → show detailed project forecast (full chart + by_model + by_provider)

**9e. Forecast Tab Container (`forecast-tab.tsx`):**

```
{isLoading ? <DashboardSkeleton /> : null}
{error ? <ErrorState /> : null}
{data && data.daily_data.length === 0 ? <EmptyState
  title="No usage data yet"
  description="Start using your API keys and come back to see spending forecasts."
/> : null}
{data && data.daily_data.length > 0 ? (
  <>
    <ForecastMetrics data={data} />
    <ForecastChart data={data.daily_data} />
    <ProviderBreakdown data={data.by_provider} />  {/* reuse existing */}
    <ProjectSelector projects={data.by_project}>
      {selectedProject === 'all'
        ? data.by_project.map(p => <ProjectForecastCard key={p.project_id} project={p} />)
        : <DetailedProjectForecast project={selectedProjectData} />
      }
    </ProjectSelector>
  </>
)}
```

**Acceptance Criteria:**
- [ ] No usage data → clean empty state with helpful message
- [ ] With usage data → metrics, chart, provider breakdown, project cards all render
- [ ] Chart shows actual (solid) vs projected (dashed) with visual "today" line
- [ ] Selecting a project shows detailed project forecast
- [ ] Trend arrows correct (red for increasing cost, green for decreasing)
- [ ] Budget utilization shows if global budget exists

---

### Task 10: Page Rewrite & Integration
**Sprint:** 3
**Assignee:** Frontend
**File:** `app/(dashboard)/estimator/page.tsx`
**Depends on:** Tasks 8, 9

**Instructions:**

Replace the entire 384-line file with:

```tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared';
import { TrendingUp, Scale } from 'lucide-react';
import { ForecastTab } from '@/components/estimator/forecast-tab';
import { CompareTab } from '@/components/estimator/compare-tab';

export default function EstimatorPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Cost Estimator"
        description="Forecast your spending and compare model pricing across providers."
      />
      <Tabs defaultValue="compare" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-1">
          <TabsTrigger
            value="compare"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 gap-1.5"
          >
            <Scale className="w-4 h-4" /> Compare Models
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 gap-1.5"
          >
            <TrendingUp className="w-4 h-4" /> Forecast
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compare" className="mt-6">
          <CompareTab />
        </TabsContent>
        <TabsContent value="forecast" className="mt-6">
          <ForecastTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Both tabs render without errors
- [ ] Tab switching is instant (no full page reload)
- [ ] Compare tab defaults as active
- [ ] All styling matches existing dark glass-morphism design
- [ ] `pnpm build` passes with zero errors
- [ ] No console errors or warnings

---

## 5. Sprint Plan

### Sprint 1 (Week 1-2): Foundation
| Task | Owner | Est |
|------|-------|-----|
| Task 1: Database Migration | Backend | 1 day |
| Task 2: Type Updates | Backend | 0.5 day |
| Task 3: Forecasting Engine + Tests | Backend | 1.5 days |
| Task 4: Server Actions | Backend | 2 days |

**Sprint 1 deliverable:** All backend logic working. `pnpm build` passes. Forecasting tests pass.

### Sprint 2 (Week 2-3): Compare Tab + Infra
| Task | Owner | Est |
|------|-------|-----|
| Task 5: Pricing Auto-Update | Backend | 2 days |
| Task 6: React Query Hooks | Frontend | 0.5 day |
| Task 7: Use Case Selector + Input Panel | Frontend | 2 days |
| Task 8: Model Grid + Cards | Frontend | 2 days |

**Sprint 2 deliverable:** Compare tab fully functional with all 85 models. Pricing cron working.

### Sprint 3 (Week 3-4): Forecast Tab + Polish
| Task | Owner | Est |
|------|-------|-----|
| Task 9: Forecast Tab (all components) | Frontend | 3 days |
| Task 10: Page Rewrite + Integration | Frontend | 0.5 day |
| QA + Bug Fixes | All | 1 day |

**Sprint 3 deliverable:** Full estimator live with both tabs.

---

## 6. Files Summary

### Create (16 files)

```
supabase/migrations/009_estimator_overhaul.sql
lib/forecasting/index.ts
lib/actions/estimator.ts
hooks/use-estimator.ts
tests/forecasting.test.ts
app/api/cron/price-update/route.ts
app/api/admin/pricing/route.ts
components/estimator/compare-tab.tsx
components/estimator/forecast-tab.tsx
components/estimator/use-case-selector.tsx
components/estimator/comparison-input-panel.tsx
components/estimator/model-comparison-grid.tsx
components/estimator/model-card.tsx
components/estimator/forecast-chart.tsx
components/estimator/forecast-metrics.tsx
components/estimator/project-forecast-card.tsx
components/estimator/project-selector.tsx
```

### Modify (6 files)

```
app/(dashboard)/estimator/page.tsx       → full rewrite
types/database.ts                        → expand PriceSnapshot
types/api.ts                             → add forecast/comparison types
lib/actions/dashboard.ts                 → add category filter to getPriceSnapshots
lib/pricing/index.ts                     → add batch/cache cost functions
vercel.json                              → add price-update cron
```

---

## 7. Reusable Existing Code

| What | File | Use For |
|------|------|---------|
| StatCard component | `components/shared/stat-card.tsx` | Forecast metrics |
| AreaChart + Recharts pattern | `components/dashboard/cost-chart.tsx` | Forecast chart |
| Provider colors/names | `components/dashboard/provider-breakdown.tsx` | Provider badges |
| Tabs (Radix) | `components/ui/tabs.tsx` | Main tab navigation |
| Select (Radix) | `components/ui/select.tsx` | Project selector |
| PageHeader, EmptyState, ErrorState, SkeletonCard | `components/shared/` | Page structure |
| formatCurrency, formatPercentage | `lib/utils.ts` | Price formatting |
| ActionResult pattern | `lib/actions/dashboard.ts` | Server action return type |
| createClient / createAdminClient | `lib/supabase/` | Auth + DB access |
| glass-card class | `app/globals.css` | Card styling |

---

## 8. Complete Model Pricing Data

> **Source:** Official provider pricing pages fetched March 28, 2026

### OPENAI — developers.openai.com/api/docs/pricing

**Text/Chat (GPT-5.x):**
```
gpt-5.4         | GPT-5.4           | text      | $2.50   | $15.00  | $0.25    | $1.25    | $7.50    | 10 | 1M
gpt-5.4-pro     | GPT-5.4 Pro       | text      | $30.00  | $180.00 | —        | $15.00   | $90.00   | 10 | 1M
gpt-5.4-mini    | GPT-5.4 Mini      | text      | $0.75   | $4.50   | $0.075   | $0.375   | $2.25    | 8  |
gpt-5.4-nano    | GPT-5.4 Nano      | text      | $0.20   | $1.25   | $0.02    | $0.10    | $0.625   | 6  |
gpt-5.3-chat    | GPT-5.3 Chat      | text      | $1.75   | $14.00  | $0.175   | $0.875   | $7.00    | 9  |
gpt-5.3-codex   | GPT-5.3 Codex     | code      | $1.75   | $14.00  | $0.175   | $0.875   | $7.00    | 9  |
gpt-5.2         | GPT-5.2           | text      | $1.75   | $14.00  | $0.175   | $0.875   | $7.00    | 9  |
gpt-5.2-pro     | GPT-5.2 Pro       | text      | $21.00  | $168.00 | $2.10    | $10.50   | $84.00   | 10 |
gpt-5.1         | GPT-5.1           | text      | $1.25   | $10.00  | $0.125   | $0.625   | $5.00    | 8  |
gpt-5.1-codex   | GPT-5.1 Codex     | code      | $1.25   | $10.00  | $0.125   | $0.625   | $5.00    | 8  |
gpt-5           | GPT-5             | text      | $1.25   | $10.00  | $0.125   | $0.625   | $5.00    | 8  |
gpt-5-mini      | GPT-5 Mini        | text      | $0.25   | $2.00   | $0.025   | $0.125   | $1.00    | 6  |
gpt-5-nano      | GPT-5 Nano        | text      | $0.05   | $0.40   | $0.005   | $0.025   | $0.20    | 4  |
```

**Text/Chat (GPT-4.x):**
```
gpt-4.1         | GPT-4.1           | text      | $2.00   | $8.00   | $0.20    | $1.00    | $4.00    | 8  | 1M
gpt-4.1-mini    | GPT-4.1 Mini      | text      | $0.40   | $1.60   | $0.04    | $0.20    | $0.80    | 7  | 1M
gpt-4.1-nano    | GPT-4.1 Nano      | text      | $0.10   | $0.40   | $0.01    | $0.05    | $0.20    | 5  | 1M
gpt-4o          | GPT-4o            | text      | $2.50   | $10.00  | $1.25    | $1.25    | $5.00    | 7  | 128K
gpt-4o-mini     | GPT-4o Mini       | text      | $0.15   | $0.60   | $0.075   | $0.075   | $0.30    | 5  | 128K
```

**Reasoning (o-series):**
```
o3              | o3                | reasoning | $2.00   | $8.00   | $1.00    | $1.00    | $4.00    | 10 | 200K
o3-pro          | o3 Pro            | reasoning | $20.00  | $80.00  | —        | —        | —        | 10 | 200K
o4-mini         | o4 Mini           | reasoning | $1.10   | $4.40   | $0.275   | $0.55    | $2.20    | 8  | 200K
o3-mini         | o3 Mini           | reasoning | $1.10   | $4.40   | $0.275   | $0.55    | $2.20    | 7  | 200K
o1              | o1                | reasoning | $15.00  | $60.00  | $7.50    | $7.50    | $30.00   | 9  | 200K
```

**Image (unit_type='images'):**
```
gpt-image-1     | GPT Image 1       | image | per_unit_price=0.042 | image_prices JSON (see Task 1)
dall-e-3        | DALL-E 3           | image | per_unit_price=0.040 | image_prices JSON (see Task 1)
dall-e-2        | DALL-E 2           | image | per_unit_price=0.020 | image_prices JSON (see Task 1)
```

**Audio:**
```
tts-1           | TTS-1             | audio | unit_type=characters | input_per_mtok=15.00 (per 1M chars)
tts-1-hd        | TTS-1 HD          | audio | unit_type=characters | input_per_mtok=30.00
gpt-4o-transcribe    | GPT-4o Transcribe     | audio | unit_type=minutes | per_unit_price=0.006
gpt-4o-mini-transcribe | GPT-4o Mini Transcribe | audio | unit_type=minutes | per_unit_price=0.003
```

**Video (unit_type='seconds'):**
```
sora-2          | Sora 2            | video | per_unit_price=0.10 (720p)
sora-2-pro      | Sora 2 Pro        | video | per_unit_price=0.30 (720p)
```

**Embedding:**
```
text-embedding-3-small | Embedding 3 Small | embedding | $0.02  | — | — | $0.01 | —
text-embedding-3-large | Embedding 3 Large | embedding | $0.13  | — | — | $0.065 | —
```

**Realtime Audio:**
```
gpt-realtime-1.5 | Realtime 1.5     | audio | audio_in=32.00 audio_out=64.00 text_in=4.00 text_out=16.00
gpt-realtime-mini | Realtime Mini    | audio | audio_in=10.00 audio_out=20.00 text_in=0.60 text_out=2.40
```

### ANTHROPIC — platform.claude.com/docs/en/about-claude/pricing

```
claude-opus-4.6     | Claude Opus 4.6     | text | $5.00  | $25.00  | $0.50  | $2.50  | $12.50 | 10 | 1M
claude-opus-4.5     | Claude Opus 4.5     | text | $5.00  | $25.00  | $0.50  | $2.50  | $12.50 | 9  | 1M
claude-opus-4.1     | Claude Opus 4.1     | text | $15.00 | $75.00  | $1.50  | $7.50  | $37.50 | 9  | 200K
claude-opus-4       | Claude Opus 4       | text | $15.00 | $75.00  | $1.50  | $7.50  | $37.50 | 9  | 200K
claude-sonnet-4.6   | Claude Sonnet 4.6   | text | $3.00  | $15.00  | $0.30  | $1.50  | $7.50  | 9  | 1M
claude-sonnet-4.5   | Claude Sonnet 4.5   | text | $3.00  | $15.00  | $0.30  | $1.50  | $7.50  | 8  | 1M
claude-sonnet-4     | Claude Sonnet 4     | text | $3.00  | $15.00  | $0.30  | $1.50  | $7.50  | 8  | 200K
claude-haiku-4.5    | Claude Haiku 4.5    | text | $1.00  | $5.00   | $0.10  | $0.50  | $2.50  | 7  | 200K
claude-haiku-3.5    | Claude Haiku 3.5    | text | $0.80  | $4.00   | $0.08  | $0.40  | $2.00  | 6  | 200K
claude-opus-3       | Claude Opus 3       | text | $15.00 | $75.00  | $1.50  | $7.50  | $37.50 | 8  | 200K (deprecated)
claude-sonnet-3.7   | Claude Sonnet 3.7   | text | $3.00  | $15.00  | $0.30  | $1.50  | $7.50  | 7  | 200K (deprecated)
claude-haiku-3      | Claude Haiku 3      | text | $0.25  | $1.25   | $0.03  | $0.125 | $0.625 | 5  | 200K
```

### GOOGLE GEMINI — ai.google.dev/gemini-api/docs/pricing

```
gemini-3.1-pro-preview          | Gemini 3.1 Pro          | text      | $2.00  | $12.00 | — | $1.00 | $6.00 | 10 | 1M
gemini-3.1-flash-lite-preview   | Gemini 3.1 Flash Lite   | text      | $0.25  | $1.50  | — | $0.125 | $0.75 | 7 | 1M
gemini-3-flash-preview          | Gemini 3 Flash          | text      | $0.50  | $3.00  | — | $0.25 | $1.50 | 8 | 1M
gemini-2.5-pro                  | Gemini 2.5 Pro          | text      | $1.25  | $10.00 | — | $0.625 | $5.00 | 9 | 1M
gemini-2.5-flash                | Gemini 2.5 Flash        | text      | $0.30  | $2.50  | — | $0.15 | $1.25 | 7 | 1M
gemini-2.5-flash-lite           | Gemini 2.5 Flash Lite   | text      | $0.10  | $0.40  | — | $0.05 | $0.20 | 5 | 1M
gemini-2.0-flash                | Gemini 2.0 Flash        | text      | $0.10  | $0.40  | — | $0.05 | $0.20 | 6 | 1M (deprecated)
gemini-1.5-pro                  | Gemini 1.5 Pro          | text      | $1.25  | $5.00  | — | $0.625 | $2.50 | 7 | 2M
gemini-1.5-flash                | Gemini 1.5 Flash        | text      | $0.075 | $0.30  | — | $0.0375 | $0.15 | 5 | 1M
imagen-4-fast                   | Imagen 4 Fast           | image     | per_unit_price=0.02
imagen-4                        | Imagen 4                | image     | per_unit_price=0.04
imagen-4-ultra                  | Imagen 4 Ultra          | image     | per_unit_price=0.06
veo-3                           | Veo 3 Standard          | video     | per_unit_price=0.40 per second
veo-3-fast                      | Veo 3 Fast              | video     | per_unit_price=0.15 per second
gemini-embedding-002            | Gemini Embedding 002    | embedding | $0.20 input
gemini-2.5-flash-preview-tts    | Gemini Flash TTS        | audio     | in=$0.50 out=$10.00
```

### xAI GROK — docs.x.ai/docs/models

```
grok-4.20-reasoning        | Grok 4.20           | reasoning | $2.00  | $6.00  | $0.20 | 10 | 2M
grok-4.20-non-reasoning    | Grok 4.20 NR        | text      | $2.00  | $6.00  | $0.20 | 9  | 2M
grok-4.20-multi-agent      | Grok 4.20 Agent     | text      | $2.00  | $6.00  | $0.20 | 9  | 2M
grok-4-1-fast-reasoning    | Grok 4.1 Fast       | reasoning | $0.20  | $0.50  | $0.05 | 7  | 2M
grok-4-1-fast-non-reasoning| Grok 4.1 Fast NR    | text      | $0.20  | $0.50  | $0.05 | 7  | 2M
grok-code-fast-1           | Grok Code Fast      | code      | $0.20  | $1.50  | —     | 7  |
grok-2-vision              | Grok 2 Vision       | text      | $2.00  | $10.00 | —     | 6  |
grok-imagine-image         | Grok Image          | image     | per_unit_price=0.02 per image
grok-imagine-image-pro     | Grok Image Pro      | image     | per_unit_price=0.07 per image
grok-imagine-video         | Grok Video          | video     | per_unit_price=0.05 per second
```

### DEEPSEEK — api-docs.deepseek.com/quick_start/pricing

```
deepseek-chat     | DeepSeek V3.2    | text      | $0.28  | $0.42  | $0.028 | 7 | 128K
deepseek-reasoner | DeepSeek R1      | reasoning | $0.28  | $0.42  | $0.028 | 8 | 128K
```

### MOONSHOT — platform.moonshot.ai/docs/pricing

```
kimi-k2.5        | Kimi K2.5         | text | $0.60  | $2.50  | $0.10 | 8 | 256K
kimi-k2          | Kimi K2           | text | $0.55  | $2.20  | —     | 7 | 256K
moonshot-v1-128k | Moonshot V1 128K  | text | $0.60  | $2.50  | —     | 5 | 128K
```

### ELEVENLABS — elevenlabs.io/pricing/api

```
eleven_multilingual_v2 | Multilingual V2 (TTS) | audio | unit_type=characters | $0.12 per 1K chars | 8
eleven_turbo_v2_5      | Turbo V2.5 (TTS)      | audio | unit_type=characters | $0.06 per 1K chars | 7
eleven_flash_v2_5      | Flash V2.5 (TTS)      | audio | unit_type=characters | $0.06 per 1K chars | 6
scribe_v2              | Scribe V2 (STT)       | audio | unit_type=minutes    | $0.22 per hour     | 7
```

---

## 9. QA Checklist

### Compare Tab
- [ ] Select "Text" → see GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro, Grok 4.20, DeepSeek V3.2, Kimi K2.5
- [ ] Select "Reasoning" → see o3, o4-mini, DeepSeek R1, Grok 4.20 reasoning
- [ ] Select "Image" → see GPT Image 1, DALL-E 3, DALL-E 2, Imagen 4 variants, Grok Image/Pro
- [ ] Select "Audio" → see ElevenLabs models, TTS-1, Whisper, Gemini TTS
- [ ] Select "Video" → see Sora 2, Veo 3, Grok Video
- [ ] Select "Code" → see GPT-5.3 Codex, GPT-5.1 Codex, Grok Code Fast
- [ ] Select "Embedding" → see text-embedding-3-small/large, Gemini Embedding 002
- [ ] Image inputs: changing images/day updates cost in real-time
- [ ] Audio inputs: changing characters/day or minutes/day updates cost
- [ ] Video inputs: changing seconds/day updates cost
- [ ] Toggle "Batch Pricing" → all prices drop ~50%
- [ ] Sort by cheapest → cheapest model first
- [ ] Sort by capable → highest capability_score first
- [ ] Sort by value → best capability/cost ratio first
- [ ] Pin 2 models → pinned cards stay at top, highlighted
- [ ] Filter by provider → only that provider's models shown
- [ ] Deprecated models hidden by default, visible if explicitly toggled

### Forecast Tab
- [ ] No usage data → empty state with helpful message
- [ ] With usage data → metrics + chart + provider breakdown + project cards
- [ ] Chart: solid area for actual, dashed for projected, vertical "today" line
- [ ] Select specific project → detailed project forecast
- [ ] Trend arrows correct direction and color
- [ ] Budget utilization shows when global budget exists

### System
- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm test` passes (including new forecasting tests)
- [ ] No console errors on either tab
- [ ] Pricing cron runs without error when triggered manually
- [ ] Admin API accepts bulk price updates

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider pricing page changes format, breaking auto-parser | Medium | Cron sends failure alert email; admin can update manually via admin API |
| Large query on usage_records for company forecast | Low | Existing getDashboardData already does the same query pattern; add index on (company_id, date) if needed |
| Image/audio/video pricing formats vary per provider | Medium | Standardize via `per_unit_price` + `image_prices` JSONB; input panel reads unit_type to adapt |
| Models deprecated mid-cycle | Low | `is_deprecated` flag; compare tab hides deprecated by default |

---

*Last updated: March 28, 2026*
