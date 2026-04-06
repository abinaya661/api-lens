# Sprint: Multi-Provider Adapter Expansion

**Date:** April 6, 2026
**Sprint Type:** Platform expansion
**Status:** Complete

---

## Summary

Expanded the API Lens adapter system from primarily OpenAI-focused to full multi-provider support across all 9 providers. Introduced a structured `ProviderCapabilities` framework, flipped Gemini and Grok from rejecting keys to accepting them, rewrote OpenRouter with per-model generation history, and added capability-aware UI throughout the application.

---

## What Changed

### 1. ProviderCapabilities Framework

**Files:** `lib/platforms/types.ts`, `lib/platforms/adapters/base.ts`, all 9 adapter files

Added a `ProviderCapabilities` interface that each adapter implements via `getCapabilities()`:

```typescript
interface ProviderCapabilities {
  canValidateKey: boolean;
  canFetchUsage: boolean;
  canFetchCost: boolean;
  canListManagedKeys: boolean;
  canPerModelBreakdown: boolean;
  canPerKeyBreakdown: boolean;
  requiresAdminKey: boolean;
  adminKeyPrefix?: string;
  keyPlaceholder?: string;
  usageNote?: string;
}
```

`BaseAdapter` provides a conservative default (all false except `canValidateKey: true`). Each adapter overrides with its specific capabilities.

### 2. Gemini Adapter — Now Accepts Keys

**File:** `lib/platforms/adapters/gemini.ts`

Before: `validateKey()` called `/v1beta/models`, got HTTP 200, then returned `{ valid: false }` — rejecting a valid key.

After: Returns `{ valid: true, keyType: 'standard' }` on 200. `fetchUsage()` returns success with empty rows (not an error), so the sync engine counts it as a success.

Capabilities: `canFetchUsage: false`, `usageNote: 'Google AI Studio does not expose a usage or billing API...'`

### 3. Grok Adapter — Now Accepts Keys

**File:** `lib/platforms/adapters/grok.ts`

Same pattern as Gemini. `validateKey()` calls `/v1/models`, returns `{ valid: true, keyType: 'standard' }` on 200. `fetchUsage()` returns success with empty rows.

### 4. OpenRouter — Per-Model Generation History

**File:** `lib/platforms/adapters/openrouter.ts`

Complete rewrite of `fetchUsage()`:

1. **Primary:** Calls `GET /api/v1/activity` with offset pagination (up to 20 pages x 100 records).
2. Filters records by date range, aggregates by `(date, model)` into `UsageRow[]` with real token counts and costs.
3. Sets `cost_source: 'api'` for activity-derived data.
4. **Fallback:** If activity endpoint fails, falls back to `GET /api/v1/auth/key` for aggregate USD amount with `cost_source: 'estimated'`.

Also updated `validateKey()` to use `/api/v1/auth/key` and return `keyType: 'standard'`.

### 5. Database Migration 012

**File:** `supabase/migrations/012_provider_capabilities.sql`

- Added missing `provider_type` enum values: `grok`, `moonshot`, `deepseek`, `elevenlabs`, `openrouter`
- Added `usage_capability` column to `api_keys` table (TEXT, NOT NULL, DEFAULT 'full')
- Backfilled existing keys based on provider

Applied to live Supabase project on April 6, 2026.

### 6. Sync Engine Optimization

**File:** `lib/platforms/sync-engine.ts`

- SELECT now includes `usage_capability`
- Keys with `usage_capability = 'validation_only'` are skipped — `last_synced_at` is updated but `fetchUsage()` is never called
- Prevents wasted API calls and false failure counts for Gemini/Grok keys

### 7. Key Add Flow

**File:** `lib/actions/keys.ts`

After `validateKey()` succeeds, derives `usage_capability` from adapter:
- `canPerModelBreakdown` = true → `'full'`
- `canFetchUsage` = true → `'aggregate'`
- Otherwise → `'validation_only'`

Stored in the `api_keys` insert.

### 8. Key Health Badges

**File:** `lib/utils/key-health.ts`

Updated `getTrackabilityConfig()` to check `usage_capability` column first:
- `full` → green "Full Tracking" badge
- `aggregate` → indigo "Aggregate Only" badge
- `validation_only` → blue "Validation Only" badge
- Falls back to legacy `has_usage_api` logic for backward compatibility

### 9. Frontend Guidance

**Files:** `app/(dashboard)/keys/page.tsx`, `app/(dashboard)/onboarding/page.tsx`

Added provider-specific guidance boxes:
- **OpenAI** (amber): Admin key required message
- **Anthropic** (violet): Admin key required message
- **Gemini** (blue): Validation-only explanation
- **Grok** (slate): Validation-only explanation
- **OpenRouter** (indigo): Per-model tracking available message
- **DeepSeek** (teal): Balance tracking explanation

Added prefix hints for Gemini (`AIza`), Grok (`xai-`), OpenRouter (`sk-or-`).

Added capability badges in key list table next to existing admin badges.

### 10. Zod Validation

**File:** `lib/validations/key.ts`

Added soft prefix check for OpenRouter in `superRefine`:
```typescript
if (data.provider === 'openrouter' && data.api_key.length > 5 && !data.api_key.startsWith('sk-or-')) {
  // soft warning
}
```

### 11. Provider Help Text

**File:** `types/providers.ts`

Updated `helpText` for Gemini, Grok, and OpenRouter to reflect actual capabilities.

---

## What Each Provider Does Now

| Provider | Accepts Keys | Usage Sync | Per-Model | Admin Required | Capability |
|----------|-------------|------------|-----------|----------------|------------|
| OpenAI | Yes | Yes | Yes | Yes (`sk-admin-`) | full |
| Anthropic | Yes | Yes | Yes | Yes (`sk-ant-admin`) | full |
| OpenRouter | Yes | Yes | Yes | No | aggregate |
| DeepSeek | Yes | Yes | No | No | aggregate |
| ElevenLabs | Yes | Yes | No | No | aggregate |
| Gemini | Yes | No | No | No | validation_only |
| Grok | Yes | No | No | No | validation_only |
| Azure OpenAI | Yes | No | No | No | validation_only |
| Moonshot | Yes | No | No | No | validation_only |

---

## Tests

### Provider Adapter Tests (`tests/provider-adapters.test.ts`)

23 tests across 3 describe blocks:

- **provider adapter validation** (7 tests): OpenAI admin prefix rejection/acceptance, Anthropic admin prefix rejection/acceptance, DeepSeek billing check, Gemini valid/invalid, Grok valid/invalid, OpenRouter auth/key validation
- **provider adapter fetchUsage** (4 tests): Gemini empty success, Grok empty success, OpenRouter per-model breakdown, OpenRouter aggregate fallback
- **provider capabilities** (9 tests): All 9 adapters' `getCapabilities()` return correct values

### Key Validation Tests (`tests/key-validation.test.ts`)

27 tests covering:

- OpenAI admin prefix enforcement
- Anthropic admin prefix enforcement
- Gemini/Grok acceptance (no prefix requirement)
- OpenRouter soft prefix check
- Endpoint URL validation (HTTPS, no private IPs, no localhost)
- Project ID UUID validation
- Update schema validation

---

## Files Modified

| File | Change Type |
|------|-------------|
| `lib/platforms/types.ts` | Added `ProviderCapabilities` interface + `getCapabilities()` |
| `lib/platforms/adapters/base.ts` | Default `getCapabilities()` |
| `lib/platforms/adapters/openai.ts` | `getCapabilities()` |
| `lib/platforms/adapters/anthropic.ts` | `getCapabilities()` |
| `lib/platforms/adapters/gemini.ts` | Flipped to accept, `getCapabilities()` |
| `lib/platforms/adapters/grok.ts` | Flipped to accept, `getCapabilities()` |
| `lib/platforms/adapters/openrouter.ts` | Rewritten fetchUsage + `getCapabilities()` |
| `lib/platforms/adapters/deepseek.ts` | `getCapabilities()` |
| `lib/platforms/adapters/elevenlabs.ts` | `getCapabilities()` |
| `lib/platforms/adapters/azure-openai.ts` | `getCapabilities()` |
| `lib/platforms/adapters/moonshot.ts` | `getCapabilities()` |
| `lib/platforms/sync-engine.ts` | Skip validation-only keys |
| `lib/actions/keys.ts` | Set `usage_capability` on insert |
| `lib/utils/key-health.ts` | Capability-aware badges |
| `lib/validations/key.ts` | OpenRouter prefix check |
| `types/database.ts` | `usage_capability` field |
| `types/providers.ts` | Updated helpText |
| `app/(dashboard)/keys/page.tsx` | Guidance boxes + badges |
| `app/(dashboard)/onboarding/page.tsx` | Guidance boxes + prefix hints |
| `supabase/migrations/012_provider_capabilities.sql` | Enum + column migration |
| `tests/provider-adapters.test.ts` | 23 tests |
| `tests/key-validation.test.ts` | 27 tests |

---

## What This Sprint Did NOT Do

1. **Did not fabricate Gemini usage data** — Google AI Studio has no billing API. A Google Cloud Billing API integration (OAuth2 + service accounts) is a separate future initiative.
2. **Did not fabricate Grok usage data** — xAI has no public billing API. When they release one, a new adapter implementation will be needed.
3. **Did not change the Anthropic adapter** — Already fully functional with admin keys, usage/cost reports, managed keys.
4. **Did not add new tables** — Only added one column (`usage_capability`) to `api_keys`.
5. **Did not break existing adapters** — `getCapabilities()` has a default in `BaseAdapter`.

---

## Verification

```bash
pnpm type-check    # No TS errors
pnpm test          # All tests pass
pnpm build         # Clean production build
pnpm lint          # No lint errors
```

Migration 012 applied to live Supabase (project: jkfwxpnvpmjauakosltl) on April 6, 2026.
