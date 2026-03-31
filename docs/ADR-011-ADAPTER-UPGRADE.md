# ADR-011: OpenAI & Anthropic Adapter Upgrade — Full Monitoring via Admin Keys

**Status:** Proposed
**Date:** 2026-03-31
**Deciders:** Backend Team, Frontend Team, DevOps

---

## Context

API Lens monitors AI API spending. The OpenAI and Anthropic adapters have critical bugs that prevent accurate monitoring:

| Problem | OpenAI | Anthropic |
|---------|--------|-----------|
| **Validation uses wrong endpoint** | Calls `/v1/models` which fails for Admin keys (`sk-admin-...`) | POSTs to `/v1/messages`, consuming real tokens on every validation |
| **Incomplete data** | Fetches costs only (no token breakdown) | Fetches tokens only (`cost_usd` hardcoded to `0`) |
| **No multi-key visibility** | Cannot list/track individual keys in the org | Cannot list/track individual keys in the org |

**Root cause:** Both adapters were built for standard API keys, but monitoring requires **Admin API keys** that access org-level usage/cost endpoints.

**Current codebase state** (important for handoff):
- Ownership model is **company-based** (`company_id` on `api_keys`, `budgets`, `alerts`; `getAuthenticatedCompany()` helper in `lib/actions/_helpers.ts`)
- API keys are stored as `encrypted_credentials` (JSONB) with fallback to legacy `encrypted_key` (stringified JSON) — see sync engine lines 40-48
- Sync engine already handles both payload formats
- Cron is already at 6-hour frequency (`vercel.json` line 5: `"0 */6 * * *"`)
- Pricing engine exists at `lib/pricing/index.ts` with `getModelPricing()`, `calculateCost()`, `calculateCostWithCache()`
- Migration numbering is at 010; next is **011**

---

## Decision

Rewrite both adapters to use admin-only API endpoints for validation and data fetching. Add multi-key inventory tracking. Fix Anthropic's $0 cost bug.

---

## Architecture

```
User pastes Admin Key (sk-admin-... / sk-ant-admin...)
        |
        v
+--- Frontend Validation ---+
| Prefix check (instant)    |
| Provider guidance UI      |
+------ Zod .superRefine ---+
        |
        v
+--- Server Validation (addKey / refreshKeyStatus) ---+
| adapter.validateKey() — admin endpoints only        |
| No inference calls, no token consumption            |
+---+--------------------------------------------------+
    | stores key_type='admin'
    v
+--- Cron (every 6h): syncAllKeys() ---+
| adapter.fetchUsage() fetches BOTH:   |
|   - Costs API  → authoritative $     |
|   - Usage API  → token counts        |
| Merges + estimates per-key cost      |
| Upserts to usage_records             |
+---+----------------------------------+
    |
    v
+--- Cron: syncManagedKeys() ---+
| adapter.listManagedKeys()    |
| Discovers all org keys       |
| Upserts to managed_keys      |
+------------------------------+
```

---

## TEAM ASSIGNMENTS & FILE OWNERSHIP

### BACKEND TEAM — Adapter & Sync Work

#### Task B1: Database Migration (`supabase/migrations/011_adapter_upgrade.sql`)
**Owner:** Backend
**Depends on:** Nothing
**Effort:** Small

New columns on `usage_records`:
```sql
ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS cached_read_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS input_audio_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_audio_tokens BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_source TEXT NOT NULL DEFAULT 'api',
  ADD COLUMN IF NOT EXISTS remote_key_id TEXT;
```

New column on `api_keys`:
```sql
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS key_type TEXT NOT NULL DEFAULT 'standard';
```

New `managed_keys` table:
```sql
CREATE TABLE public.managed_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  provider TEXT NOT NULL,
  remote_key_id TEXT NOT NULL,
  remote_key_name TEXT,
  redacted_value TEXT,
  remote_project_id TEXT,
  remote_project_name TEXT,
  last_used_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_tracked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_key_id, remote_key_id)
);

ALTER TABLE public.managed_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own managed keys"
  ON public.managed_keys FOR SELECT
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE INDEX idx_managed_keys_parent ON public.managed_keys(parent_key_id);
```

New composite unique index for remote_key_id-aware upserts:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_upsert_v2
  ON public.usage_records(key_id, date, model, COALESCE(remote_key_id, ''));
```

#### Task B2: Update TypeScript Types (`types/database.ts`)
**Owner:** Backend
**Depends on:** B1

Add to `UsageRecord`:
```typescript
cached_read_tokens?: number;
cache_creation_tokens?: number;
input_audio_tokens?: number;
output_audio_tokens?: number;
cost_source?: string;
remote_key_id?: string | null;
```

Add to `ApiKey`:
```typescript
key_type?: string;  // 'standard' | 'admin'
```

Add new interface:
```typescript
export interface ManagedKey {
  id: string;
  parent_key_id: string;
  company_id: string;
  provider: string;
  remote_key_id: string;
  remote_key_name: string | null;
  redacted_value: string | null;
  remote_project_id: string | null;
  remote_project_name: string | null;
  last_used_at: string | null;
  first_seen_at: string;
  is_tracked: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Task B3: Extend Platform Interfaces (`lib/platforms/types.ts`)
**Owner:** Backend
**Depends on:** B2

Extend `UsageRow` with optional fields (backward compatible — all other 7 adapters untouched):
```typescript
cached_read_tokens?: number;
cache_creation_tokens?: number;
input_audio_tokens?: number;
output_audio_tokens?: number;
cost_source?: 'api' | 'estimated' | 'blended';
remote_key_id?: string;
```

Extend `PlatformAdapter`:
```typescript
validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }>;
listManagedKeys?(apiKey: string): Promise<ManagedKeyInfo[]>;
```

Add `ManagedKeyInfo` interface:
```typescript
export interface ManagedKeyInfo {
  remote_key_id: string;
  name: string | null;
  redacted_value: string | null;
  project_id: string | null;
  project_name: string | null;
  last_used_at: string | null;
}
```

#### Task B4: OpenAI Adapter Rewrite (`lib/platforms/adapters/openai.ts`)
**Owner:** Backend
**Depends on:** B3

**`validateKey()` — new logic:**
1. Prefix check: must start with `sk-admin-`. If not, return descriptive error telling user to create an Admin key at platform.openai.com
2. Try `GET /v1/organization/costs?start_time={24h_ago}&end_time={now}&limit=1` with `Authorization: Bearer {key}`
3. If 200 → `{ valid: true, keyType: 'admin' }`
4. If not, try `GET /v1/organization/usage/completions?start_time={24h_ago}&end_time={now}&limit=1`
5. If 200 → `{ valid: true, keyType: 'admin' }`
6. Otherwise → `{ valid: false, error: '...' }`

**CRITICAL: Removes the `/v1/models` call** that fails for admin keys.

**`fetchUsage()` — new logic:**
Call both APIs in parallel:
1. **Costs API**: `GET /v1/organization/costs?start_time={}&end_time={}&group_by[]=line_item&bucket_width=1d`
   - Pagination: loop while `has_more`, pass `page` cursor
   - Builds `Map<model, cost_usd>` (authoritative)
2. **Usage API**: `GET /v1/organization/usage/completions?start_time={}&end_time={}&group_by[]=model&group_by[]=api_key_id&bucket_width=1d`
   - Pagination: loop while `has_more`, pass `next_page`
   - Returns per-key, per-model token breakdown: `input_tokens`, `output_tokens`, `input_cached_tokens`, `input_audio_tokens`, `output_audio_tokens`, `num_model_requests`

**Cost merging algorithm:**
- For each Usage API row, estimate cost: `key_cost = model_total_cost * (key_total_tokens / model_total_tokens)`
- If Costs API has no data for that model, use `getModelPricing('openai', model)` + `calculateCost()` from `lib/pricing/index.ts`
- Set `cost_source: 'estimated'` for per-key rows

**Helper methods to add:**
- `private async fetchCostsApi(apiKey, startTime, endTime)` — paginated Costs API fetch
- `private async fetchUsageApi(apiKey, startTime, endTime)` — paginated Usage API fetch

**`listManagedKeys()` — new method:**
1. `GET /v1/organization/projects?limit=100` → list all org projects
2. For each project: `GET /v1/organization/projects/{project_id}/api_keys?limit=100`
3. Return `ManagedKeyInfo[]` with remote_key_id, name, redacted_value, project context

#### Task B5: Anthropic Adapter Rewrite (`lib/platforms/adapters/anthropic.ts`)
**Owner:** Backend
**Depends on:** B3

**`validateKey()` — new logic:**
1. Prefix check: must start with `sk-ant-admin`. If not, return descriptive error
2. Try `GET /v1/organizations/usage_report/messages?starting_at={yesterday}&ending_at={now}&bucket_width=1d&limit=1` with `x-api-key: {key}`, `anthropic-version: 2023-06-01`
3. If 200 → `{ valid: true, keyType: 'admin' }`
4. If not, try `GET /v1/organizations/cost_report?starting_at={yesterday}&ending_at={now}&bucket_width=1d&limit=1`
5. If 200 → `{ valid: true, keyType: 'admin' }`
6. Otherwise → `{ valid: false, error: '...' }`

**CRITICAL: Removes the `POST /v1/messages` inference call** that currently wastes tokens on every validation.

**`fetchUsage()` — new logic:**
Call both APIs in parallel:
1. **Usage API**: `GET /v1/organizations/usage_report/messages?starting_at={}&ending_at={}&group_by[]=api_key_id&group_by[]=model&bucket_width=1d&limit=31`
   - Pagination: follow `has_more` / cursor
   - Returns: `uncached_input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens`, `api_key_id`, `model`
2. **Cost API**: `GET /v1/organizations/cost_report?starting_at={}&ending_at={}&bucket_width=1d&limit=31`
   - Returns: total cost per bucket in **USD cents** (decimal strings)
   - Build `Map<date, cost_usd>` — **divide by 100** to convert cents to dollars

**Cost estimation per row:**
- Use `getModelPricing('anthropic', model)` from `lib/pricing/index.ts`
- Use `calculateCostWithCache()` for cache-read tokens (priced at `cached_input_per_mtok`)
- Cache-creation tokens: priced at 125% of input rate (add helper)
- **Reconciliation**: For each date, if Cost API returned an authoritative total, scale all row-level estimates for that date proportionally to sum to the total → set `cost_source: 'blended'`

**FIXES: `cost_usd: 0` bug** — current adapter hardcodes this on line 58.

**Helper methods to add:**
- `private async fetchUsageReport(apiKey, dateFrom, dateTo)` — paginated Usage API
- `private async fetchCostReport(apiKey, dateFrom, dateTo)` — paginated Cost API
- `private estimateCost(model, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens)` — uses pricing engine
- `private reconcileCosts(rows, dateCostMap)` — scales estimates to match authoritative totals

**`listManagedKeys()` — new method:**
- `GET /v1/organizations/api_keys?limit=100&status=active` with cursor pagination (`after_id`)
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`
- Return `ManagedKeyInfo[]`

#### Task B6: Sync Engine Updates (`lib/platforms/sync-engine.ts`)
**Owner:** Backend
**Depends on:** B4, B5

**6A. Update upsert record mapping** in `syncAllKeys()` (around line 63-72):
Add new fields to the record object:
```typescript
cached_read_tokens: row.cached_read_tokens ?? 0,
cache_creation_tokens: row.cache_creation_tokens ?? 0,
input_audio_tokens: row.input_audio_tokens ?? 0,
output_audio_tokens: row.output_audio_tokens ?? 0,
cost_source: row.cost_source ?? 'api',
remote_key_id: row.remote_key_id ?? null,
```

**6B. Update upsert conflict target** (line 76):
The existing `onConflict: 'key_id,date,model'` must account for the new composite index. Since Supabase upsert uses column names and COALESCE is in the index, use a raw query or adjust the approach so that rows with different `remote_key_id` values don't collide.

**6C. Add `syncManagedKeys()` function:**
```typescript
export async function syncManagedKeys(): Promise<{ keys_discovered: number }> {
  const supabase = createAdminClient();
  let keysDiscovered = 0;

  // 1. Query api_keys WHERE is_active=true AND key_type='admin'
  const { data: adminKeys } = await supabase
    .from('api_keys')
    .select('id, company_id, provider, encrypted_credentials, encrypted_key, key_type')
    .eq('is_active', true)
    .eq('key_type', 'admin');

  if (!adminKeys) return { keys_discovered: 0 };

  for (const key of adminKeys) {
    const adapter = getAdapter(key.provider);
    if (!adapter?.listManagedKeys) continue;

    // Decrypt using same dual-format logic as syncAllKeys
    const payload = key.encrypted_credentials
      ? (key.encrypted_credentials as unknown as EncryptedPayload)
      : key.encrypted_key
        ? (JSON.parse(key.encrypted_key) as EncryptedPayload)
        : null;
    if (!payload) continue;

    const plainKey = decryptCredentials(payload);
    const managedKeys = await adapter.listManagedKeys(plainKey);

    for (const mk of managedKeys) {
      const { error } = await supabase
        .from('managed_keys')
        .upsert({
          parent_key_id: key.id,
          company_id: key.company_id,
          provider: key.provider,
          remote_key_id: mk.remote_key_id,
          remote_key_name: mk.name,
          redacted_value: mk.redacted_value,
          remote_project_id: mk.project_id,
          remote_project_name: mk.project_name,
          last_used_at: mk.last_used_at,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'parent_key_id,remote_key_id' });

      if (!error) keysDiscovered++;
    }
  }

  return { keys_discovered: keysDiscovered };
}
```

**6D. Wire into cron** (`app/api/cron/sync-and-check/route.ts`, line 27-30):
```typescript
const syncStats = await syncAllKeys();
const managedKeyStats = await syncManagedKeys();  // NEW — add import
const budgetResult = await checkBudgets();
```
Add `managed_keys: managedKeyStats` to the response JSON object.

#### Task B7: Server Action Updates (`lib/actions/keys.ts`)
**Owner:** Backend
**Depends on:** B2, B3

In `addKey()` (around line 128-145): after `adapter.validateKey()` succeeds, store `key_type`:
```typescript
const keyType = validation.keyType ?? 'standard';
// In the insert object:
key_type: keyType,
```

In `refreshKeyStatus()` (the success path around line 298-310): also update `key_type` from validation result.

---

### FRONTEND TEAM — Validation & UI Guidance

#### Task F1: Zod Schema Prefix Validation (`lib/validations/key.ts`)
**Owner:** Frontend
**Depends on:** Nothing (can start immediately)

Add `.superRefine()` after the existing `z.object({...})`:
```typescript
export const addKeySchema = z.object({
  // ... existing fields unchanged ...
}).superRefine((data, ctx) => {
  if (data.provider === 'openai' && !data.api_key.startsWith('sk-admin-')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'OpenAI requires an Admin API key (starts with sk-admin-...). Create one at platform.openai.com -> Settings -> API Keys.',
      path: ['api_key'],
    });
  }
  if (data.provider === 'anthropic' && !data.api_key.startsWith('sk-ant-admin')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Anthropic requires an Admin API key (starts with sk-ant-admin...). Create one at console.anthropic.com -> Settings -> Admin API Keys.',
      path: ['api_key'],
    });
  }
});
```

#### Task F2: Keys Page — Admin Key Guidance (`app/(dashboard)/keys/page.tsx`)
**Owner:** Frontend
**Depends on:** Nothing

**Location:** Inside `renderModal()`, after the API key input `<div>` block (after line 323, before the `</div>` closing the `space-y-5` container).

**F2a. Provider guidance boxes** (show when provider is selected, below the key input):
```tsx
{formProvider === 'openai' && (
  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
    <p className="text-xs text-emerald-400 font-medium mb-1">Admin API Key Required</p>
    <p className="text-[11px] text-zinc-400 leading-relaxed">
      API Lens needs an <strong>Admin API Key</strong> (starts with <code className="text-zinc-300">sk-admin-...</code>).
      Only organization owners can create these.
    </p>
    <a href="https://platform.openai.com/settings/organization/api-keys"
       target="_blank" rel="noopener noreferrer"
       className="text-[11px] text-emerald-400 hover:underline mt-1 inline-block">
      Create admin key on OpenAI &rarr;
    </a>
  </div>
)}
{formProvider === 'anthropic' && (
  <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
    <p className="text-xs text-orange-400 font-medium mb-1">Admin API Key Required</p>
    <p className="text-[11px] text-zinc-400 leading-relaxed">
      API Lens needs an <strong>Admin API Key</strong> (starts with <code className="text-zinc-300">sk-ant-admin...</code>).
      Only organization admins can create these.
    </p>
    <a href="https://console.anthropic.com/settings/admin-api-keys"
       target="_blank" rel="noopener noreferrer"
       className="text-[11px] text-orange-400 hover:underline mt-1 inline-block">
      Create admin key on Anthropic &rarr;
    </a>
  </div>
)}
```

**F2b. Real-time prefix warning** (add state + display):
```tsx
// Add to component body (around line 55, after existing state declarations):
const keyPrefixError = useMemo(() => {
  if (!formProvider || !formKey) return null;
  if (formProvider === 'openai' && formKey.length > 5 && !formKey.startsWith('sk-admin-'))
    return 'OpenAI keys must start with sk-admin-...';
  if (formProvider === 'anthropic' && formKey.length > 10 && !formKey.startsWith('sk-ant-admin'))
    return 'Anthropic keys must start with sk-ant-admin...';
  return null;
}, [formProvider, formKey]);

// Display below the key input (after line 307, before the masked key preview):
{keyPrefixError && (
  <p className="text-xs text-yellow-400 mt-1.5">{keyPrefixError}</p>
)}
```

**F2c. Update `canSubmit`** (line 157):
```typescript
const canSubmit = formProvider && formLabel.trim() && formKey.trim() && !isSubmitting
  && !keyPrefixError  // NEW — block submission on wrong prefix
  && (projectMode !== 'new' || newProjectName.trim())
  && (projectMode !== 'existing' || selectedProjectId);
```

#### Task F3: Onboarding Page — Same Guidance (`app/(dashboard)/onboarding/page.tsx`)
**Owner:** Frontend
**Depends on:** F2

**Location:** In Step 1 (Add Key), after the API Key input div (after line 255), add:
1. The same provider guidance boxes from F2a (using `provider` state variable instead of `formProvider`)
2. The same prefix warning from F2b (using `provider` and `apiKey` state variables)
3. Add `keyPrefixError` useMemo using the same logic
4. Update the disabled check on the "Add Key & Continue" button (line 269-271) to also check `!!keyPrefixError`

#### Task F4: Provider Config Help Text (`types/providers.ts`)
**Owner:** Frontend
**Depends on:** Nothing

Update the `helpText` in `PROVIDER_CONFIGS` for openai and anthropic:
```typescript
openai: {
  fields: [{
    // ... keep existing key, label, type, placeholder, required
    helpText: 'Admin API key required (sk-admin-...). Go to platform.openai.com -> Settings -> API Keys. Only org owners can create these.',
  }],
},
anthropic: {
  fields: [{
    // ... keep existing key, label, type, placeholder, required
    helpText: 'Admin API key required (sk-ant-admin...). Go to console.anthropic.com -> Settings -> Admin API Keys. Only org admins can create these.',
  }],
},
```

---

## API Endpoint Reference

### OpenAI Admin Endpoints (used by adapter)

| Endpoint | Method | Purpose | Auth Header |
|----------|--------|---------|-------------|
| `/v1/organization/costs` | GET | Authoritative cost data by model | `Authorization: Bearer {admin_key}` |
| `/v1/organization/usage/completions` | GET | Token usage by key+model | `Authorization: Bearer {admin_key}` |
| `/v1/organization/projects` | GET | List org projects | `Authorization: Bearer {admin_key}` |
| `/v1/organization/projects/{id}/api_keys` | GET | List keys in project | `Authorization: Bearer {admin_key}` |

**Pagination pattern:** `has_more: boolean` + `next_page: string` token. Loop until `has_more === false`.

**Key params for Costs API:**
- `start_time` / `end_time`: Unix timestamps (seconds)
- `bucket_width`: `1d` (only option)
- `group_by[]`: `line_item` (maps to model name), `project_id`
- Returns: `results[].amount.value` (USD), `results[].line_item`

**Key params for Usage API:**
- `start_time` / `end_time`: Unix timestamps (seconds)
- `bucket_width`: `1m`, `1h`, `1d`
- `group_by[]`: `model`, `api_key_id`, `project_id`, `user_id`, `batch`, `service_tier`
- `api_key_ids[]`: filter to specific keys
- Returns: `data[].results[].input_tokens`, `.output_tokens`, `.input_cached_tokens`, `.input_audio_tokens`, `.output_audio_tokens`, `.num_model_requests`

### Anthropic Admin Endpoints (used by adapter)

| Endpoint | Method | Purpose | Auth Header |
|----------|--------|---------|-------------|
| `/v1/organizations/usage_report/messages` | GET | Token usage by key+model | `x-api-key: {admin_key}` + `anthropic-version: 2023-06-01` |
| `/v1/organizations/cost_report` | GET | Daily cost totals (USD cents) | Same |
| `/v1/organizations/api_keys` | GET | List org API keys | Same |

**Pagination pattern:** `has_more: boolean` + cursor via `after_id`.

**Key params for Usage API:**
- `starting_at` / `ending_at`: ISO 8601 timestamps
- `bucket_width`: `1h`, `1d`
- `group_by[]`: `api_key_id`, `model`, `workspace_id`, `service_tier`, `context_window`, `data_residency`, `speed`
- `api_key_ids[]`: filter to specific keys
- `limit`: max results per page
- Returns: `data[].results[].uncached_input_tokens`, `.cache_read_input_tokens`, `.cache_creation_input_tokens`, `.output_tokens`, `.api_key_id`, `.model`

**Key params for Cost API:**
- `starting_at` / `ending_at`: ISO 8601
- `bucket_width`: `1h`, `1d`
- Returns costs in **USD cents as decimal strings** — **must divide by 100**

**Key params for List API Keys:**
- `limit`: max 100
- `status`: `active`, `inactive`, `archived`
- `after_id`: cursor for pagination
- Returns: `data[].id`, `.name`, `.partial_key_hint`, `.workspace_id`, `.status`

---

## User Input Requirements (What to Collect from Users)

| Field | OpenAI | Anthropic | Other Providers |
|-------|--------|-----------|-----------------|
| **Key type required** | Admin API Key | Admin API Key | Standard API Key |
| **Key prefix** | `sk-admin-...` | `sk-ant-admin...` | Varies |
| **Who can create** | Org owners only | Org admins only | Anyone with account |
| **Where to create** | platform.openai.com -> Settings -> API Keys | console.anthropic.com -> Settings -> Admin API Keys | Provider dashboard |
| **Frontend fields** | api_key (password), nickname (text), project (optional), notes (optional) | Same | Same |
| **Prefix validated** | Client-side (instant yellow warning) + Server-side (Zod superRefine) + Adapter | Same | No prefix check |
| **Server validation** | Costs API or Usage API probe (no inference) | Usage API or Cost API probe (no inference) | Varies by adapter |
| **Copy behavior** | Key shown once at creation, then never again | Same | Varies |

---

## Data Fields Collected Per Sync Cycle

### OpenAI (via Admin Key)
| Field | DB Column | Source API | Notes |
|-------|-----------|------------|-------|
| Cost (USD) | `cost_usd` | Costs API | Authoritative per model; **estimated** per key |
| Input tokens | `input_tokens` | Usage API | Per key, per model |
| Output tokens | `output_tokens` | Usage API | Per key, per model |
| Cached input tokens | `cached_read_tokens` | Usage API | `input_cached_tokens` field |
| Audio input tokens | `input_audio_tokens` | Usage API | For Whisper/TTS models |
| Audio output tokens | `output_audio_tokens` | Usage API | For TTS models |
| Request count | `request_count` | Usage API | `num_model_requests` |
| Child key ID | `remote_key_id` | Usage API | `api_key_id` from group_by |
| Cost source | `cost_source` | Derived | `'api'` or `'estimated'` |

### Anthropic (via Admin Key)
| Field | DB Column | Source API | Notes |
|-------|-----------|------------|-------|
| Cost (USD) | `cost_usd` | Estimated + reconciled | From pricing table, scaled to Cost API daily total |
| Input tokens | `input_tokens` | Usage API | `uncached_input_tokens + cache_read_input_tokens` |
| Output tokens | `output_tokens` | Usage API | Direct |
| Cache-read tokens | `cached_read_tokens` | Usage API | `cache_read_input_tokens` |
| Cache-creation tokens | `cache_creation_tokens` | Usage API | `cache_creation_input_tokens` |
| Request count | `request_count` | N/A | Anthropic doesn't return this; set to `0` |
| Child key ID | `remote_key_id` | Usage API | `api_key_id` from group_by |
| Cost source | `cost_source` | Derived | `'blended'` when reconciled, `'estimated'` otherwise |

---

## Existing Utilities to Reuse (DO NOT recreate)

| Utility | File | How to use |
|---------|------|------------|
| `getModelPricing(provider, model)` | `lib/pricing/index.ts:42` | Get per-MTok pricing for cost estimation |
| `calculateCost(input, output, pricing)` | `lib/pricing/index.ts:58` | Standard token-to-USD conversion |
| `calculateCostWithCache(input, output, pricing)` | `lib/pricing/index.ts:83` | Uses `cached_input_per_mtok` rate |
| `calculateCostWithBatch(input, output, pricing)` | `lib/pricing/index.ts:68` | Uses batch pricing rates |
| `encryptCredentials(plaintext)` | `lib/encryption/index.ts` | Encrypt new keys |
| `decryptCredentials(payload)` | `lib/encryption/index.ts` | Decrypt stored keys |
| `extractKeyHint(key)` | `lib/encryption/index.ts` | Last 4 chars for display |
| `getAuthenticatedCompany(supabase)` | `lib/actions/_helpers.ts` | Auth + company_id resolution |
| `logAudit(supabase, {...})` | `lib/utils/audit.ts` | Audit trail |
| `checkRateLimit(limiter, id)` | `lib/ratelimit/index.ts` | Rate limiting |
| `getAdapter(provider)` | `lib/platforms/registry.ts` | Adapter lookup |
| `PROVIDER_COLORS` | `lib/utils/provider-config.ts` | Provider color classes |
| `getHealthConfig(key)` | `lib/utils/key-health.ts` | Key health status badge config |

---

## Implementation Sequence

```
Week 1:
  Backend: B1 (migration) → B2 (types) → B3 (interfaces)  [sequential]
  Frontend: F1 (Zod) + F4 (provider config)                [parallel with backend]

Week 1-2:
  Backend: B4 (OpenAI adapter) + B5 (Anthropic adapter)     [parallel with each other]
  Frontend: F2 (keys page UI) + F3 (onboarding page)        [parallel with backend]

Week 2:
  Backend: B6 (sync engine) → B7 (server actions)           [sequential, after B4/B5]
  Integration testing starts
```

| Task | Owner | Depends On | Files Modified |
|------|-------|------------|----------------|
| B1 | Backend | — | `supabase/migrations/011_adapter_upgrade.sql` |
| B2 | Backend | B1 | `types/database.ts` |
| B3 | Backend | B2 | `lib/platforms/types.ts` |
| B4 | Backend | B3 | `lib/platforms/adapters/openai.ts` |
| B5 | Backend | B3 | `lib/platforms/adapters/anthropic.ts` |
| B6 | Backend | B4, B5 | `lib/platforms/sync-engine.ts`, `app/api/cron/sync-and-check/route.ts` |
| B7 | Backend | B2, B3 | `lib/actions/keys.ts` |
| F1 | Frontend | — | `lib/validations/key.ts` |
| F2 | Frontend | — | `app/(dashboard)/keys/page.tsx` |
| F3 | Frontend | F2 | `app/(dashboard)/onboarding/page.tsx` |
| F4 | Frontend | — | `types/providers.ts` |

---

## Consequences

**What becomes easier:**
- Accurate cost tracking for Anthropic (fixes $0 bug)
- Full token breakdown including cached/audio tokens for both providers
- Users see clear guidance on which key type to create
- Invalid key prefixes caught instantly in the browser before server round-trip
- Multi-key org visibility without users manually entering each key
- No wasted tokens on validation (removes Anthropic inference call)
- Admin keys work for OpenAI (removes broken `/v1/models` call)

**What becomes harder:**
- Cost accuracy depends on pricing table freshness (`price_snapshots` must stay current via price-update cron — already running bi-weekly)
- Per-key cost for OpenAI is estimated (Costs API doesn't group by `api_key_id`) — users must understand these are approximations
- Admin keys are harder for users to obtain (requires org owner/admin role)

**What we'll need to revisit:**
- Dashboard UI to display `managed_keys` inventory and per-key breakdowns
- Whether to expose `cost_source` badges in the UI ("estimated" vs "actual")
- Add similar admin-key adapters for other providers as they add usage APIs

---

## Verification Plan

### Unit Tests
**File:** `tests/key-validation.test.ts`
- Test: non-admin OpenAI prefix rejected (`sk-proj-abc` → error)
- Test: admin OpenAI prefix accepted (`sk-admin-abc123` → passes schema)
- Test: non-admin Anthropic prefix rejected (`sk-ant-api-abc` → error)
- Test: admin Anthropic prefix accepted (`sk-ant-admin-abc` → passes schema)
- Test: other providers unaffected (gemini `AIza...` still passes, deepseek `sk-...` still passes)

**File:** `tests/provider-adapters.test.ts`
- Mock Costs API + Usage API responses for OpenAI adapter
- Mock Usage Report + Cost Report responses for Anthropic adapter
- Verify cost estimation produces non-zero `cost_usd` values
- Verify cache token fields are populated correctly
- Verify pagination handling (multi-page responses)
- Verify `listManagedKeys()` returns expected structure

### Manual Smoke Tests
1. Paste `sk-admin-...` key for OpenAI → validates without calling `/v1/models`
2. Paste `sk-ant-admin...` key for Anthropic → validates without `POST /v1/messages`
3. Paste non-admin key for either → instant yellow prefix warning in UI + Zod rejection on submit
4. Trigger sync (`GET /api/cron/sync-and-check` with `Authorization: Bearer {CRON_SECRET}`) → check `usage_records`:
   - OpenAI: `cost_usd > 0`, token counts present, `cached_read_tokens` for cached models
   - Anthropic: `cost_usd > 0` (was previously 0), `cached_read_tokens` + `cache_creation_tokens` populated
5. Check `managed_keys` table populated with discovered child keys after sync
6. Dashboard total spend reflects new Anthropic costs
7. Other 7 adapters still work unchanged (add a Gemini/DeepSeek key, verify no regressions)

### Build Verification
```bash
pnpm typecheck   # No new TS errors from interface changes
pnpm test        # All existing + new tests pass
pnpm build       # Clean production build (no missing imports)
```

---

*Generated 2026-03-31. For latest code state, always refer to the repository.*
