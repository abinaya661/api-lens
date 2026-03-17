# API Lens — Platform Integration Reference v1
# 14 platforms. All auto-sync. No manual logging. No custom platforms.

---

## How syncing works

Every 15 minutes the sync-and-check cron job calls each provider's billing API.
The provider returns your usage data. We store it. Your dashboard updates.

The "delay" column means: how long after you make an API call does the provider
publish the billing data. This is the provider's limitation. API Lens syncs the
moment data becomes available.

---

## The 14 Platforms

| Platform | Delay | Unit | Pattern |
|---|---|---|---|
| OpenAI | 5 minutes | Tokens | 2 |
| Anthropic | Real-time | Tokens | 2 |
| Mistral | 1 hour | Tokens | 2 |
| Cohere | Daily | Tokens | 2 |
| OpenRouter | Daily | Tokens (credit diff) | 1 |
| Google Gemini | 3 hours | Tokens | 4 |
| Google Vertex AI | 24-48 hours | Tokens | 4 |
| Azure OpenAI | 1 hour | Tokens | 4 |
| AWS Bedrock | Daily | Tokens + exact cost | 4 |
| ElevenLabs | Real-time | Characters | 3 |
| Deepgram | Real-time | Minutes | 3 |
| AssemblyAI | Real-time | Minutes | 3 |
| Replicate | Real-time | Compute seconds | 3 |
| Fal AI | Real-time | Images | 3 |

---

## UsageRecord — the shape every adapter produces

```typescript
// /types/platform.ts
export interface UsageRecord {
  date:         string   // YYYY-MM-DD
  model:        string
  inputTokens:  number   // 0 for non-token platforms
  outputTokens: number   // 0 for non-token platforms
  totalTokens:  number   // 0 for non-token platforms
  unitType:     'tokens' | 'characters' | 'minutes' | 'images' | 'compute_seconds'
  unitCount:    number   // actual billable units
  costUsd:      number   // ALWAYS calculated — never 0 unless genuinely free
  requestCount: number
}
```

---

## Adapter files

```
/lib/platforms/
  index.ts                         ← routes to correct adapter by detected_pattern
  registry.ts                      ← loads from DB platforms table, 5-min cache
  /adapters/
    pattern1-openai-compatible.ts  ← OpenRouter
    pattern2-custom-token.ts       ← OpenAI, Anthropic, Mistral, Cohere
    pattern3-per-unit.ts           ← ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal
    pattern4-cloud-billing.ts      ← Gemini, Vertex AI, Azure OpenAI, AWS Bedrock
```

---

## Error handling — identical for all adapters

```
401 / 403  → set is_valid=false, consecutive_failures++, create key_invalid alert
429        → skip this cycle, retry next cycle — do NOT mark key invalid
5xx        → consecutive_failures++, retry next cycle
Timeout    → consecutive_failures++, retry next cycle
3+ failures in a row → create sync_failed alert, send email to user
Never log decrypted API key in any error message under any circumstances
```

---

## Auto-detection — POST /api/platforms/detect

Input: `{ apiKey: string }`

Detection rules (check in order):
```
sk-admin-    → openai (high confidence)
sk-ant-      → anthropic (high confidence)
sk-or-       → openrouter (high confidence)
r8_          → replicate (high confidence)
fal-         → fal (high confidence)
AIza         → gemini (high confidence — confirm if project ID needed)
AKIA         → bedrock (high confidence)
sk-          → openai or mistral or cohere (medium confidence — check length/format)
{...json...} → vertex_ai (high confidence if valid JSON with private_key)
```

Response:
```typescript
{
  platformId: string | null
  confidence: 'high' | 'medium' | 'low'
  message?:   string   // "Looks like OpenRouter — confirm?"
}
```

---

## PATTERN 2 — Per-Token Custom Format

### OpenAI

```
Key type:    Organization Admin Key
Prefix:      sk-admin-
Key page:    platform.openai.com → Settings → API Keys → Create Admin Key
WARNING:     Regular keys (sk-proj-...) return 403 on usage endpoint

validateKey():
  If key does not start with 'sk-admin-':
    return {
      valid: false,
      error: 'OpenAI requires an Admin Key (sk-admin-...). Regular project keys cannot access usage data.'
    }
  GET https://api.openai.com/v1/models
  Authorization: Bearer {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.openai.com/v1/organization/usage/completions
  Authorization: Bearer {key}
  Params:
    start_time = unix timestamp of startDate at 00:00:00 UTC
    end_time   = unix timestamp of endDate at 23:59:59 UTC
    group_by   = ["model"]
  Response shape:
  {
    "data": [{
      "aggregation_timestamp": 1234567890,
      "model": "gpt-4o",
      "input_tokens": 450000,
      "output_tokens": 120000,
      "num_model_requests": 380
    }]
  }
  Per record:
    date = new Date(aggregation_timestamp * 1000).toISOString().split('T')[0]
    inputTokens = input_tokens
    outputTokens = output_tokens
    totalTokens = input_tokens + output_tokens
    Look up model in price_snapshots
    costUsd = (input_tokens / 1_000_000 * input_per_mtok) + (output_tokens / 1_000_000 * output_per_mtok)
    unitType = 'tokens'
    unitCount = totalTokens
    requestCount = num_model_requests
```

---

### Anthropic

```
Key type:    Admin Key
Prefix:      sk-ant-
Key page:    console.anthropic.com → Settings → API Keys

validateKey():
  POST https://api.anthropic.com/v1/messages
  Headers:
    x-api-key: {key}
    anthropic-version: 2023-06-01
  Body: {"model":"claude-haiku-3","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}
  Non-401 response = valid (even 400 = key works, request invalid)
  401 = invalid key

fetchUsage():
  GET https://api.anthropic.com/v1/organizations/usage_report
  Headers:
    x-api-key: {key}
    anthropic-version: 2023-06-01
  Params: start_date=YYYY-MM-DD, end_date=YYYY-MM-DD, group_by=model
  Response shape:
  {
    "data": [{
      "date": "2024-01-15",
      "model": "claude-opus-4-6",
      "input_tokens": 320000,
      "output_tokens": 85000,
      "requests": 240
    }]
  }
  costUsd = (input/1M * input_price) + (output/1M * output_price)
  unitType = 'tokens'
```

---

### Mistral

```
Key page:    console.mistral.ai → API Keys

validateKey():
  GET https://api.mistral.ai/v1/models
  Authorization: Bearer {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.mistral.ai/v1/usage/history
  Authorization: Bearer {key}
  Params: start_date=YYYY-MM-DD, end_date=YYYY-MM-DD
  Response shape:
  {
    "data": [{
      "date": "2024-01-15",
      "model": "mistral-large-latest",
      "input_tokens": 150000,
      "output_tokens": 40000,
      "requests": 120
    }]
  }
  unitType = 'tokens'
```

---

### Cohere

```
Key page:    dashboard.cohere.com → API Keys

validateKey():
  GET https://api.cohere.com/v1/models
  Authorization: Bearer {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.cohere.com/v1/usage
  Authorization: Bearer {key}
  Returns monthly usage per model.
  If only monthly totals returned: distribute evenly across days in range.
  unitType = 'tokens'
```

---

## PATTERN 1 — OpenAI-Compatible

### OpenRouter

```
Key prefix:  sk-or-
Key page:    openrouter.ai/keys

validateKey():
  GET https://openrouter.ai/api/v1/models
  Authorization: Bearer {key}
  200 → valid, 401 → invalid

fetchUsage():
  Strategy: daily credit balance diffing.
  OpenRouter has no usage history API — exposes total credits used only.

  GET https://openrouter.ai/api/v1/auth/key
  Authorization: Bearer {key}
  Returns: { "data": { "usage": 12.45 } }
  — this is total USD spent since account creation —

  Logic:
    1. Read today's total from API → today_total
    2. Read yesterday's stored total from api_keys.notes
       (stored as JSON string: {"or_balance_usd": 11.20})
    3. today_spend = today_total - yesterday_total
    4. Write today_total back to api_keys.notes
    5. If no previous value: store today_total, return [] (first sync — no diff available)

  result:
    date = today's date
    unitType = 'tokens' (estimated — model breakdown not available)
    model = 'openrouter/mixed'
    costUsd = today_spend
    unitCount = 0 (token count not available from credit diff)
    requestCount = 0

  NOTE: Run once per day in daily-tasks cron only — not every 15 minutes.
        Pattern 1 adapter is called from daily-tasks Step 1 only.
```

---

## PATTERN 4 — Cloud Billing APIs

### Google Gemini

```
Key type:    API Key from Google AI Studio
Prefix:      AIza
Key page:    aistudio.google.com/app/apikey
Extra field: GCP Project ID (stored in api_keys.endpoint_url)

validateKey():
  POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}
  Body: { "contents": [{ "parts": [{ "text": "hi" }] }] }
  200 or 400 → valid (400 = key works, request body invalid)
  403 → invalid key

fetchUsage():
  Uses Google Cloud Monitoring API.
  Requires GCP project ID from api_keys.endpoint_url.

  GET https://monitoring.googleapis.com/v3/projects/{projectId}/timeSeries
  Query params:
    ?key={apiKey}
    &filter=metric.type="generativelanguage.googleapis.com/token_count"
    &interval.startTime={startDate}T00:00:00Z
    &interval.endTime={endDate}T23:59:59Z
    &aggregation.alignmentPeriod=86400s
    &aggregation.perSeriesAligner=ALIGN_SUM

  Response has timeSeries entries with:
    - metric.labels.model → model name
    - points[].value.int64Value → token count for that day

  costUsd = (token_count / 1_000_000) * price from price_snapshots where provider='gemini'
  unitType = 'tokens'

  NOTE: 3-hour delay. Show sync delay badge on key detail page.
  If monitoring returns empty: key may not have billing enabled.
  Create info alert: "Enable Cloud Billing in GCP to see Gemini costs."
```

---

### Google Vertex AI

```
Key type:    Service Account JSON (full JSON file contents as string)
Key page:    GCP Console → IAM → Service Accounts → Create Key → JSON
Extra field: GCP Project ID (stored in api_keys.endpoint_url)
Required roles: roles/monitoring.viewer AND roles/bigquery.dataViewer

validateKey():
  Parse JSON string to extract: client_email, private_key, project_id
  Exchange for access token:
    1. Create JWT with claims:
       iss = client_email
       scope = 'https://www.googleapis.com/auth/cloud-platform'
       aud = 'https://oauth2.googleapis.com/token'
       exp = now + 3600
       iat = now
    2. Sign JWT with private_key (RS256 algorithm)
    3. POST https://oauth2.googleapis.com/token
       Body (form-encoded):
         grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
         assertion={signed_jwt}
  If access_token returned → valid

fetchUsage():
  Step 1: Get access token (same as validateKey)
  Step 2: GET Cloud Monitoring timeSeries
    GET https://monitoring.googleapis.com/v3/projects/{projectId}/timeSeries
    Authorization: Bearer {access_token}
    filter: metric.type="aiplatform.googleapis.com/prediction/online/token_count"
    Interval: startTime to endTime, daily aggregation (86400s)
  Step 3: costUsd = token_count * price from price_snapshots where provider='vertex_ai'
  unitType = 'tokens'

  NOTE: 24-48 hour delay. Show delay badge on key detail page.
```

---

### Azure OpenAI

```
Key type:    Azure API Key
Key page:    Azure Portal → Cognitive Services → Your Resource → Keys and Endpoint
Extra field: Endpoint URL (stored in api_keys.endpoint_url)
             Example: https://my-resource.openai.azure.com

validateKey():
  GET {endpoint_url}/openai/models?api-version=2024-02-01
  api-key: {key}
  200 → valid, 401 → invalid

fetchUsage():
  Uses Azure Monitor Metrics API.
  Parse endpoint_url to extract resource name.

  GET https://management.azure.com/subscriptions/{subscriptionId}/
      resourceGroups/{resourceGroup}/
      providers/Microsoft.CognitiveServices/accounts/{accountName}/
      providers/microsoft.insights/metrics
  Query params:
    ?metricnames=TokenTransaction
    &api-version=2023-10-01
    &timespan={startDate}/{endDate}
    &interval=P1D
  api-key: {key}

  NOTE: For v1, request subscriptionId, resourceGroup, and accountName as
  additional form fields when user adds an Azure OpenAI key.
  costUsd = token_count * price from price_snapshots where provider='azure_openai'
  unitType = 'tokens'
```

---

### AWS Bedrock

```
Key type:    IAM credentials stored as JSON string
             {"accessKeyId": "AKIA...", "secretAccessKey": "...", "region": "us-east-1"}
Key page:    AWS Console → IAM → Users → Create User → Access Keys
Extra field: AWS Region stored in api_keys.endpoint_url (e.g. "us-east-1")
Required permissions: ce:GetCostAndUsage AND cloudwatch:GetMetricData ONLY

validateKey():
  Parse JSON to extract accessKeyId, secretAccessKey, region.
  Make SigV4 signed request:
    GET https://bedrock.{region}.amazonaws.com/foundation-models
    Signed with AWS SigV4
  200 → valid, AuthFailure → invalid

fetchUsage():
  Step 1 — Exact cost from AWS Cost Explorer (us-east-1 endpoint always):
    POST https://ce.us-east-1.amazonaws.com/
    Content-Type: application/x-amz-json-1.1
    X-Amz-Target: AWSInsightsIndexService.GetCostAndUsage
    SigV4 signed
    Body:
    {
      "TimePeriod": { "Start": "YYYY-MM-DD", "End": "YYYY-MM-DD" },
      "Granularity": "DAILY",
      "Filter": { "Dimensions": { "Key": "SERVICE", "Values": ["Amazon Bedrock"] } },
      "Metrics": ["BlendedCost"],
      "GroupBy": [{ "Type": "DIMENSION", "Key": "USAGE_TYPE" }]
    }
    Use Cost Explorer's BlendedCost as costUsd directly.

  Step 2 — Token counts from CloudWatch:
    POST https://monitoring.{region}.amazonaws.com/
    Action: GetMetricData (SigV4 signed)
    Namespace: AWS/Bedrock
    Metrics: InputTokenCount, OutputTokenCount
    Dimensions: ModelId
    Period: 86400 (daily)

  SigV4 signing steps (implement exactly):
    1. canonical_request = method + \n + uri + \n + query + \n + headers + \n + signed_headers + \n + hex(sha256(body))
    2. string_to_sign = "AWS4-HMAC-SHA256" + \n + timestamp + \n + credential_scope + \n + hex(sha256(canonical_request))
    3. signing_key = HMAC-SHA256(HMAC-SHA256(HMAC-SHA256(HMAC-SHA256("AWS4"+secret_key, date), region), "bedrock"), "aws4_request")
    4. signature = hex(HMAC-SHA256(signing_key, string_to_sign))
    5. Authorization header = "AWS4-HMAC-SHA256 Credential={accessKeyId}/{scope}, SignedHeaders={headers}, Signature={signature}"
```

---

## PATTERN 3 — Per-Unit Non-Token

### ElevenLabs

```
Key page:    elevenlabs.io/app/settings/api-keys
Unit:        characters of text converted to speech
Cost metric: price per 1 million characters

validateKey():
  GET https://api.elevenlabs.io/v1/user
  xi-api-key: {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.elevenlabs.io/v1/history
  xi-api-key: {key}
  Params: page_size=1000
  Paginate until all items within date range are fetched.

  Per history item:
    date = new Date(item.date_unix * 1000).toISOString().split('T')[0]
    unitCount += item.character_count_change
    model = item.model_id

  Group by date + model.
  costUsd = (unitCount / 1_000_000) * input_per_mtok from price_snapshots where provider='elevenlabs'
  unitType = 'characters'
  inputTokens = 0, outputTokens = 0, totalTokens = 0
```

---

### Deepgram

```
Key page:    console.deepgram.com
Unit:        minutes of audio transcribed
Cost metric: price per minute

validateKey():
  GET https://api.deepgram.com/v1/projects
  Authorization: Token {key}
  200 → valid, 401 → invalid

fetchUsage():
  Step 1: GET https://api.deepgram.com/v1/projects
  Use first project ID.

  Step 2: GET https://api.deepgram.com/v1/projects/{projectId}/usage/requests
  Authorization: Token {key}
  Params: start=YYYY-MM-DDT00:00:00Z, end=YYYY-MM-DDT23:59:59Z, limit=100, page=0
  Paginate through all pages.

  Per request (status='succeeded' only):
    date = request.created split to date
    duration_seconds = request.metadata.duration
    model = request.request.model

  Group by date + model.
  unitCount = total_duration_seconds / 60  (convert to minutes)
  costUsd = unitCount * input_per_mtok from price_snapshots where provider='deepgram'
  unitType = 'minutes'
  inputTokens = 0, outputTokens = 0, totalTokens = 0
```

---

### AssemblyAI

```
Key page:    assemblyai.com/app/account
Unit:        minutes of audio transcribed
Cost metric: price per minute

validateKey():
  GET https://api.assemblyai.com/v2/account
  Authorization: {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.assemblyai.com/v2/usage
  Authorization: {key}
  Params: start=YYYY-MM-DD, end=YYYY-MM-DD
  Response: { "daily": [{ "date": "2024-01-15", "seconds": 3720, "requests": 24 }] }

  Per day:
    unitCount = seconds / 60  (convert to minutes)
    costUsd = unitCount * input_per_mtok from price_snapshots where provider='assemblyai'
    model = 'best' (or breakdown if available)
    unitType = 'minutes'
  inputTokens = 0, outputTokens = 0, totalTokens = 0
```

---

### Replicate

```
Key prefix:  r8_
Key page:    replicate.com/account/api-tokens
Unit:        GPU compute seconds
Cost metric: price per compute second (varies by model/hardware)

validateKey():
  GET https://api.replicate.com/v1/models
  Authorization: Token {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://api.replicate.com/v1/predictions?per_page=100
  Authorization: Token {key}
  Paginate using next_cursor until predictions outside date range.
  Filter: created_at within startDate to endDate.
  Only include predictions with status='succeeded' (failed ones are not billed).

  Per prediction:
    date = prediction.created_at split to date
    model = prediction.model
    compute_seconds = prediction.metrics.predict_time (float, GPU seconds)
    cost = use prediction's cost field if available, otherwise estimate

  Group by date + model.
  unitCount = sum(compute_seconds)
  costUsd = sum(individual prediction costs from Replicate)
  unitType = 'compute_seconds'
  inputTokens = 0, outputTokens = 0, totalTokens = 0
```

---

### Fal AI

```
Key prefix:  fal-
Key page:    fal.ai/dashboard/keys
Unit:        images or videos generated
Cost metric: price per image/video generation (varies by model)

validateKey():
  GET https://fal.run/api/v1/dashboard/usage
  Authorization: Key {key}
  200 → valid, 401 → invalid

fetchUsage():
  GET https://fal.run/api/v1/dashboard/usage
  Authorization: Key {key}
  Params: start_date=YYYY-MM-DD, end_date=YYYY-MM-DD
  Response: daily breakdown with USD cost per day per model.
  Fal provides exact USD cost directly — use that value.

  unitType = 'images'
  unitCount = number of generations per day
  costUsd = from Fal API response directly (do not recalculate)
  inputTokens = 0, outputTokens = 0, totalTokens = 0
```

---

## Key Intelligence Panel — content per platform

When a user selects a platform in the Add Key dialog, the right panel shows:

1. **What this key does** — from platforms.key_type_description
2. **Where to get it** — step instructions + button linking to platforms.key_page_url
3. **Typical monthly spend** — platforms.avg_monthly_usd_low to avg_monthly_usd_high
4. **What this platform charges for** — based on platforms.unit_type:
   - tokens: "Charged per token processed"
   - characters: "Charged per character of speech generated"
   - minutes: "Charged per minute of audio transcribed"
   - images: "Charged per image or video generated"
   - compute_seconds: "Charged per second of GPU compute used"
5. **Capabilities** — badge icons from supports_* columns
6. **Sync delay** — shown if sync_delay_minutes > 60:
   - 180 → "Cost data updates every 3 hours"
   - 1440 → "Cost data updates once daily"
   - 2880 → "Cost data updates every 24-48 hours (Google Cloud limitation)"
7. **Special warning** — yellow box if platforms.special_warning is not null
8. **Duplicate warning** — if user already has a key from this provider

---

## Onboarding tip — shown on Step 3 (Add first key)

"Pro tip: For clean per-project cost tracking, create a separate API key
for each project in your provider dashboard.

Example:
  OpenAI key 1 → Customer chatbot
  OpenAI key 2 → Internal search tool
  OpenAI key 3 → Code assistant

Each key's spend is tracked and reported independently."
