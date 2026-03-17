# Skill 07 — AI Platform Integration & Cost Optimisation
# Expert: AIX — AI Integration Expert

I have worked with every major AI API since GPT-3. Pricing changes fast —
what was cheapest six months ago may be superseded today. These patterns
are designed to be maintainable as the market evolves rapidly.

---

## The Unified Platform Interface — why abstraction matters

// /lib/platforms/index.ts
// Without this: every feature that touches platform APIs needs to know
// about every platform. Adding a new platform means changing 10 files.
// With this: adding a new platform means creating ONE new adapter file.

export type PlatformId =
  | 'openai' | 'anthropic' | 'mistral' | 'cohere'
  | 'openrouter'
  | 'gemini' | 'vertex_ai' | 'azure_openai' | 'bedrock'
  | 'elevenlabs' | 'deepgram' | 'assemblyai' | 'replicate' | 'fal'

// Normalised shape — all platforms produce this.
// OpenAI calls them "prompt_tokens" and "completion_tokens".
// Anthropic calls them "input_tokens" and "output_tokens".
// We normalise everything. Application code never needs to know the difference.
export interface UsageRecord {
  date:         string   // YYYY-MM-DD
  model:        string
  inputTokens:  number   // 0 for non-token platforms
  outputTokens: number   // 0 for non-token platforms
  totalTokens:  number   // 0 for non-token platforms
  unitType:     UnitType
  unitCount:    number   // the actual billable units
  costUsd:      number   // ALWAYS calculated, never 0 unless genuinely free
  requestCount: number
}

export type UnitType =
  | 'tokens'          // OpenAI, Anthropic, Mistral, Cohere, Gemini, Vertex, Azure, Bedrock, OpenRouter
  | 'characters'      // ElevenLabs
  | 'minutes'         // Deepgram, AssemblyAI
  | 'images'          // Fal AI
  | 'compute_seconds' // Replicate

export interface ModelInfo {
  id:                  string
  name:                string
  inputPricePerMtok:   number  // USD per million input tokens (or per million units for non-token)
  outputPricePerMtok:  number  // USD per million output tokens (0 for non-token platforms)
  batchDiscount?:      number  // 0.5 = 50% off for batch API
  cacheDiscount?:      number  // 0.1 = 90% off for prompt cache reads
  contextWindow?:      number
  unitType:            UnitType
}

// Every platform adapter file exports these:
export async function fetchUsage(
  provider:     string,
  decryptedKey: string,
  startDate:    string,   // YYYY-MM-DD
  endDate:      string,   // YYYY-MM-DD
  options?:     { endpointUrl?: string }
): Promise<UsageRecord[]>

export async function validateKey(
  provider:     string,
  decryptedKey: string,
  endpointUrl?: string
): Promise<{ valid: boolean; error?: string }>

---

## Cost Tracking Design Rule — absolute

cost_usd is ALWAYS calculated and stored at sync time.
All dashboard queries sum cost_usd. No conditional logic based on unit_type.
unit_type is only used for display on the key detail page.

Why: if we stored only token/unit counts and calculated on each query,
a pricing change would retroactively change all historical costs.
A user would see their February spend change when March prices update.
Pre-calculating at sync time means each record shows the actual cost
at the time the units were used — accurate and immutable.

---

## Cost Calculation — complete implementation

// /lib/utils/cost.ts

export function calculateCostUsd(
  inputUnits:    number,    // tokens, characters, minutes, images, compute_seconds
  outputUnits:   number,    // 0 for non-token platforms
  inputPerMunit: number,    // price per million units (or per unit for some platforms)
  outputPerMunit: number,
  options?: {
    batchDiscount?:    number   // 0.5 = 50% off
    cacheReadUnits?:   number
    cacheReadDiscount?: number  // 0.1 = 90% off for cache reads
  }
): number {
  let inputCost  = (inputUnits  / 1_000_000) * inputPerMunit
  let outputCost = (outputUnits / 1_000_000) * outputPerMunit

  // Cache read units charged at significant discount (e.g. 10% of input price).
  // Anthropic charges cache_read_input_tokens at 0.1x normal input price.
  if (options?.cacheReadUnits && options?.cacheReadDiscount !== undefined) {
    const fullPrice      = (options.cacheReadUnits / 1_000_000) * inputPerMunit
    const discountedCost = fullPrice * options.cacheReadDiscount
    inputCost            = inputCost - fullPrice + discountedCost
  }

  const subtotal = inputCost + outputCost
  const discount = options?.batchDiscount ?? 0
  // Round to 8 decimal places — matches cost_usd column precision
  return Math.round(subtotal * (1 - discount) * 100_000_000) / 100_000_000
}

// For non-token platforms where pricing is per-unit (not per-million):
// ElevenLabs: price per 1M characters
// Deepgram/AssemblyAI: price per minute (NOT per million minutes)
// Replicate: price per compute second (NOT per million)
// Fal: price per image (NOT per million)
//
// For Deepgram/AssemblyAI/Replicate/Fal: use direct multiplication, not per-million:
export function calculatePerUnitCost(unitCount: number, pricePerUnit: number): number {
  return Math.round(unitCount * pricePerUnit * 100_000_000) / 100_000_000
}

export function estimateMonthlyUsd(params: {
  messagesPerDay:    number
  avgInputTokens:    number
  avgOutputTokens:   number
  numUsers:          number
  inputPerMtok:      number
  outputPerMtok:     number
  useBatch?:         boolean
  daysInMonth?:      number
}): number {
  const days          = params.daysInMonth ?? 30
  const totalMessages = params.messagesPerDay * params.numUsers * days
  return calculateCostUsd(
    totalMessages * params.avgInputTokens,
    totalMessages * params.avgOutputTokens,
    params.inputPerMtok,
    params.outputPerMtok,
    { batchDiscount: params.useBatch ? 0.5 : undefined }
  )
}

// Model swap suggestion — the "switch to X, save Y" calculation
export function calculateModelSwapSavings(
  currentMonthlyUsd:   number,
  targetModel:         ModelInfo,
  monthlyInputUnits:   number,
  monthlyOutputUnits:  number
): { savingsUsd: number; savingsPercent: number; targetMonthlyUsd: number } {
  const targetMonthlyUsd = calculateCostUsd(
    monthlyInputUnits,
    monthlyOutputUnits,
    targetModel.inputPricePerMtok,
    targetModel.outputPricePerMtok
  )
  const savingsUsd     = currentMonthlyUsd - targetMonthlyUsd
  const savingsPercent = Math.round((savingsUsd / currentMonthlyUsd) * 100)
  return {
    savingsUsd:       Math.round(savingsUsd * 100) / 100,
    savingsPercent,
    targetMonthlyUsd: Math.round(targetMonthlyUsd * 100) / 100,
  }
}

export function costPer1000Requests(totalCostUsd: number, requestCount: number): number {
  if (requestCount === 0) return 0
  return Math.round((totalCostUsd / requestCount) * 1000 * 100) / 100
}

---

## Format Utilities — all number display goes through these

// /lib/utils/format.ts
// Never format numbers inline. Centralised formatting means
// one change updates every display. Consistency builds user trust.

export function formatUsd(amount: number): string {
  // Adaptive precision: 4 decimal places for sub-cent amounts, 2 for rest.
  // "$0.0025" is more informative than "$0.00" for small AI costs.
  const places = amount > 0 && amount < 0.01 ? 4 : 2
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(amount)
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-US')
}

// Display unit counts with the right label for each platform
export function formatUnits(unitCount: number, unitType: UnitType): string {
  switch (unitType) {
    case 'tokens':          return `${formatTokens(unitCount)} tokens`
    case 'characters':      return `${formatTokens(unitCount)} chars`
    case 'minutes':         return `${unitCount.toFixed(1)} min`
    case 'images':          return `${unitCount.toLocaleString()} images`
    case 'compute_seconds': return `${unitCount.toFixed(1)}s compute`
  }
}

export function formatRelativeTime(date: string | Date): string {
  const diff  = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(mins  / 60)
  const days  = Math.floor(hours / 24)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date(date))
  // en-IN locale: "16 Mar 2026" — correct for Indian developers.
}

// Used for "Last synced X" indicator shown on all data views
export function formatLastSynced(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return formatRelativeTime(date)
}

export function budgetProgressPercent(spent: number, budget: number): number {
  if (budget <= 0) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

export function budgetProgressColour(percent: number): string {
  if (percent >= 100) return '#ef4444'  // danger
  if (percent >= 90)  return '#ef4444'  // danger
  if (percent >= 75)  return '#f59e0b'  // warning
  return '#10b981'                       // success
}

---

## Error Handling Rules for All Platform Adapters

// These rules apply to every adapter in /lib/platforms/adapters/

401 / 403 → key invalid or expired
  → set is_valid = false on api_keys row
  → increment consecutive_failures
  → create key_invalid alert
  → do NOT retry

429 → rate limited by provider
  → log warning
  → skip this cycle
  → do NOT mark key invalid
  → do NOT increment consecutive_failures for rate limits

5xx → provider server error
  → increment consecutive_failures
  → skip this cycle (Razorpay will retry next cron run)
  → do NOT mark key invalid

Timeout → per-key timeout is 30 seconds
  → increment consecutive_failures
  → skip this cycle

3+ consecutive failures → create sync_failed alert + send email

// NEVER EVER log the decrypted API key in any error message.
// Even in development. Even in tests. Never.
// If you need to debug a key issue: log the key_id and provider only.
