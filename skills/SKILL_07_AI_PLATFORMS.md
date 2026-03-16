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
// With this: adding a new platform means creating ONE new file.

export type PlatformId =
  | 'openai' | 'anthropic' | 'gemini' | 'aws'
  | 'azure'  | 'mistral'   | 'cohere' | 'custom'

// Normalised shape — all platforms produce this.
// OpenAI calls them "prompt_tokens" and "completion_tokens".
// Anthropic calls them "input_tokens" and "output_tokens".
// We normalise everything. Application code never needs to know the difference.
export interface UsageRecord {
  date:         string  // YYYY-MM-DD
  model:        string
  inputTokens:  number
  outputTokens: number
  totalTokens:  number  // stored for convenience — input + output
  costUsd:      number  // pre-calculated at sync time
  requestCount: number
}

export interface ModelInfo {
  id:                  string
  name:                string
  inputPricePerMtok:   number  // USD per million input tokens
  outputPricePerMtok:  number  // USD per million output tokens
  batchDiscount?:      number  // 0.5 = 50% off for batch API
  cacheDiscount?:      number  // 0.1 = 90% off for prompt cache reads
  contextWindow?:      number
}

// Every platform file must export these three:
export async function fetchUsage(
  decryptedKey: string,
  startDate:    string,
  endDate:      string,
  options?:     Record<string, string>
): Promise<UsageRecord[]>

export async function validateKey(
  decryptedKey: string,
  endpointUrl?: string
): Promise<{ valid: boolean; error?: string }>

export const platformInfo: PlatformInfo

---

## Platform API Quick Reference

OpenAI:
  Usage:    GET https://api.openai.com/v1/organization/usage/completions
  Auth:     Authorization: Bearer {ADMIN_KEY}
  Params:   start_time (unix), end_time (unix), group_by=["model"]
  Note:     Requires Organisation Admin Key — NOT a regular project key
  Validate: GET https://api.openai.com/v1/models

Anthropic:
  Usage:    GET https://api.anthropic.com/v1/organizations/usage_report
  Auth:     x-api-key: {ADMIN_KEY}, anthropic-version: 2023-06-01
  Params:   start_date (YYYY-MM-DD), end_date, group_by=model
  Validate: POST https://api.anthropic.com/v1/messages (minimal request)

Google Gemini:
  Tokens:   Cloud Monitoring — aiplatform.googleapis.com/prediction/online/token_count
  Cost:     BigQuery billing export (24-48h delay)
  Auth:     Service Account with roles/monitoring.viewer + roles/bigquery.dataViewer
  Note:     Most complex integration — include setup guide in add-key dialog

AWS Bedrock:
  Tokens:   CloudWatch — Namespace: AWS/Bedrock, Metrics: InputTokenCount, OutputTokenCount
  Cost:     Cost Explorer — SERVICE = "Amazon Bedrock"
  Auth:     IAM with ce:GetCostAndUsage + cloudwatch:GetMetricData only
  Note:     Needs AWS region selector in key form

Azure OpenAI:
  Usage:    Azure Monitor Metrics — TokenTransaction metric
  Auth:     Azure API key from Azure Portal
  Note:     Endpoint URL required per resource — show endpoint URL field

Mistral:
  Usage:    GET https://api.mistral.ai/v1/usage/history
  Auth:     Authorization: Bearer {API_KEY}
  Validate: GET https://api.mistral.ai/v1/models

Cohere:
  Usage:    GET https://api.cohere.com/v1/usage
  Auth:     Authorization: Bearer {API_KEY}
  Validate: GET https://api.cohere.com/v1/models

Custom:
  No API — manual cost entry only
  validateKey() always returns { valid: true }
  User logs usage manually via "Log Usage" button

---

## Error Handling Rules for All Platforms

401/403 → key invalid or expired → set is_valid = false on api_keys row, create alert
429     → rate limited → log warning, retry next cycle, do NOT mark key invalid
5xx     → provider error → log warning, retry next cycle
Timeout → log warning, retry next cycle
Never log the decrypted API key in any error message under any circumstances.

---

## Cost Calculation — complete implementation

// /lib/utils/cost.ts
// We pre-calculate cost_usd at sync time, not at query time.
// Why: if we stored only token counts and calculated on each query,
// a pricing change would retroactively change all historical costs.
// A user would see their February spend change when March prices update.
// Pre-calculating at sync time means each record shows the actual cost
// at the time the tokens were used — accurate and immutable.

export function calculateCostUsd(
  inputTokens:   number,
  outputTokens:  number,
  inputPerMtok:  number,
  outputPerMtok: number,
  options?: { batchDiscount?: number; cacheReadTokens?: number; cacheReadDiscount?: number }
): number {
  let inputCost  = (inputTokens  / 1_000_000) * inputPerMtok
  let outputCost = (outputTokens / 1_000_000) * outputPerMtok

  // Cache read tokens charged at significant discount (e.g. 10% of input price).
  // Anthropic charges cache_read_input_tokens at 0.1x normal input price.
  if (options?.cacheReadTokens && options?.cacheReadDiscount) {
    const fullPrice      = (options.cacheReadTokens / 1_000_000) * inputPerMtok
    const discountedCost = fullPrice * options.cacheReadDiscount
    inputCost            = inputCost - fullPrice + discountedCost
  }

  const subtotal = inputCost + outputCost
  const discount = options?.batchDiscount ?? 0
  return Math.round(subtotal * (1 - discount) * 1_000_000_00) / 1_000_000_00
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
  monthlyInputTokens:  number,
  monthlyOutputTokens: number
): { savingsUsd: number; savingsPercent: number; targetMonthlyUsd: number } {
  const targetMonthlyUsd = calculateCostUsd(
    monthlyInputTokens,
    monthlyOutputTokens,
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

export function budgetProgressPercent(spent: number, budget: number): number {
  if (budget <= 0) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}