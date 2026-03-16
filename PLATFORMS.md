# API Lens — Platform Integration Reference

Details for connecting to each platform's billing and usage APIs.

---

## Platform Interface (every platform must follow this)

```typescript
// What every platform file must export:
export async function fetchUsage(decryptedKey: string, startDate: string, endDate: string, options?: Record<string,string>): Promise<UsageRecord[]>
export async function validateKey(decryptedKey: string, endpointUrl?: string): Promise<{ valid: boolean; error?: string }>
export const platformInfo: PlatformInfo

// UsageRecord shape:
interface UsageRecord {
  date: string           // YYYY-MM-DD
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  requestCount: number
}
```

---

## 1. OpenAI

**Key type:** Organization Admin Key (starts sk-admin-...)
**Where to get it:** platform.openai.com → Settings → API Keys → Create Admin Key
**Note:** Regular project keys do NOT work for usage data

```
Usage API:
GET https://api.openai.com/v1/organization/usage/completions
Authorization: Bearer {ADMIN_KEY}
Params: start_time (unix), end_time (unix), group_by=["model"]

Validate:
GET https://api.openai.com/v1/models
Authorization: Bearer {KEY}
```

**Input hint to show user:** "Paste your Admin API Key (starts with sk-admin-...) from platform.openai.com → Settings → API Keys"

---

## 2. Anthropic

**Key type:** Admin Key from Anthropic Console
**Where to get it:** console.anthropic.com → Settings → API Keys

```
Usage API:
GET https://api.anthropic.com/v1/organizations/usage_report
x-api-key: {ADMIN_KEY}
anthropic-version: 2023-06-01
Params: start_date (YYYY-MM-DD), end_date, group_by=model

Validate:
POST https://api.anthropic.com/v1/messages
x-api-key: {KEY}
anthropic-version: 2023-06-01
Body: {"model":"claude-haiku-3","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}
```

---

## 3. Google Gemini

**Key type:** Service Account JSON
**Where to get it:** GCP Console → IAM → Service Accounts → Create → Download JSON
**Required roles:** roles/monitoring.viewer + roles/bigquery.dataViewer

```
Tokens (near real-time — Cloud Monitoring):
GET https://monitoring.googleapis.com/v3/projects/{PROJECT_ID}/timeSeries
Auth: Bearer {ACCESS_TOKEN from service account}
Metric: aiplatform.googleapis.com/prediction/online/token_count

Cost (24-48h delay — BigQuery billing export):
SELECT service.description, sku.description, SUM(cost), SUM(usage.amount)
FROM billing_export
WHERE service.description = 'Vertex AI'
```

**Extra fields needed:** GCP Project ID, BigQuery dataset name
**Input hint:** "Paste your Service Account JSON. Get it from GCP Console → IAM → Service Accounts → Create Key → JSON"

---

## 4. AWS Bedrock

**Key type:** IAM Access Key + Secret
**Required permissions only:** ce:GetCostAndUsage + cloudwatch:GetMetricData

```
Tokens (CloudWatch):
Namespace: AWS/Bedrock
Metrics: InputTokenCount, OutputTokenCount
Dimensions: ModelId

Cost (Cost Explorer):
POST https://ce.us-east-1.amazonaws.com/GetCostAndUsage
Filter: SERVICE = "Amazon Bedrock"
Granularity: DAILY
```

**Extra fields needed:** AWS Region selector
**Input hint:** "Paste your AWS Access Key ID and Secret Access Key. Create an IAM user with only ce:GetCostAndUsage and cloudwatch:GetMetricData permissions."

---

## 5. Azure OpenAI

**Key type:** Azure API Key (from Azure Portal)
**Endpoint URL required** — different per Azure resource

```
Usage (Azure Monitor):
GET https://management.azure.com/subscriptions/{SUB}/resourceGroups/{RG}/
    providers/Microsoft.CognitiveServices/accounts/{ACCOUNT}/
    providers/microsoft.insights/metrics
Metric: TokenTransaction

Validate:
GET {ENDPOINT_URL}/openai/models?api-version=2024-02-01
api-key: {API_KEY}
```

**Extra fields needed:** Azure Endpoint URL (e.g. https://my-resource.openai.azure.com)
**Input hint:** "Paste your Azure API Key and endpoint URL from Azure Portal → Cognitive Services → Your Resource → Keys and Endpoint"

---

## 6. Mistral AI

**Key type:** Standard API key
**Where to get it:** console.mistral.ai → Workspace → API Keys

```
Usage API:
GET https://api.mistral.ai/v1/usage/history
Authorization: Bearer {API_KEY}
Params: start_date, end_date

Validate:
GET https://api.mistral.ai/v1/models
Authorization: Bearer {API_KEY}
```

---

## 7. Cohere

**Key type:** Standard API key
**Where to get it:** dashboard.cohere.com → API Keys

```
Usage API:
GET https://api.cohere.com/v1/usage
Authorization: Bearer {API_KEY}

Validate:
GET https://api.cohere.com/v1/models
Authorization: Bearer {API_KEY}
```

---

## 8. Custom Platform

**No API integration — manual entry only**

Fields user provides:
- Platform name (e.g. "My Private LLM")
- Cost model: per-request OR per-1k-tokens
- Cost amount in USD
- Base URL (optional)

Usage entry: user clicks "Log Usage" on key detail page, enters date + request count + optional token count, app calculates cost automatically.

Stored in: `api_keys.custom_cost_per_request` or `api_keys.custom_cost_per_1k_tokens`

---

## Sync Strategy

```
Every 15 minutes: OpenAI, Anthropic, Mistral, Cohere
Every 24 hours:   Gemini (BigQuery delay), AWS (Cost Explorer delay), Azure
Manual only:      Custom platforms
```

## Error Handling Rules

- 401/403 → set is_valid = false on api_keys, create alert
- 429 → log warning, retry next cycle, do NOT set key invalid
- 5xx → log warning, retry next cycle
- Network timeout → log warning, retry next cycle
- Never log the decrypted API key in any error message
