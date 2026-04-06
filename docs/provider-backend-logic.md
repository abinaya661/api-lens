# Provider Backend Logic Explainer

This document explains, in plain English, how API Lens currently verifies keys and how it tracks usage or billing for each provider.

It is written for product, marketing, investor conversations, and internal planning.

**Last updated:** April 6, 2026

## Global flow

When a user adds a key:

1. The UI sends the selected provider and the pasted credential to the backend.
2. Zod validation checks provider-specific prefix requirements (e.g., `sk-admin-` for OpenAI, `sk-ant-admin` for Anthropic, `sk-or-` for OpenRouter).
3. The backend loads the provider-specific adapter from `lib/platforms/registry.ts`.
4. The adapter runs `validateKey()` — a provider-specific verification flow.
5. On success, `getCapabilities()` is called to determine the adapter's `usage_capability` tier: `full`, `aggregate`, or `validation_only`.
6. The key is encrypted (AES-256-GCM envelope encryption) and stored with its `usage_capability` value.
7. On failure the key is rejected and not stored.

During cron sync:

1. The sync engine loads all active keys.
2. Keys with `usage_capability = 'validation_only'` are skipped — their `last_synced_at` is updated but no API call is made.
3. Keys with `full` or `aggregate` capability call `fetchUsage()` on the adapter.
4. Results are upserted into `usage_records`.

## Provider capability tiers

| Tier | Meaning | Providers |
|------|---------|-----------|
| **full** | Per-model + per-key cost breakdown, managed key discovery | OpenAI, Anthropic |
| **aggregate** | Usage sync but without full per-key attribution | OpenRouter, DeepSeek, ElevenLabs |
| **validation_only** | Key validated and stored, no usage sync | Gemini, Grok, Azure OpenAI, Moonshot |

## Provider matrix

| Provider | Key format | Verification endpoint | Usage endpoint | Capability tier |
|----------|-----------|----------------------|----------------|-----------------|
| OpenAI | `sk-admin-...` (admin key required) | `GET /v1/organization/costs` | `GET /v1/organization/costs` | full |
| Anthropic | `sk-ant-admin...` (admin key required) | `GET /v1/organizations/usage_report/messages` | Usage report + cost report APIs | full |
| OpenRouter | `sk-or-...` (standard key) | `GET /api/v1/auth/key` | `GET /api/v1/activity` (paginated) | aggregate |
| DeepSeek | Standard key | `GET /user/balance` | `GET /user/balance` | aggregate |
| ElevenLabs | Standard key | `GET /v1/usage/character-stats` | `GET /v1/usage/character-stats` | aggregate |
| Gemini | `AIza...` (standard key) | `GET /v1beta/models` | None | validation_only |
| Grok / xAI | `xai-...` (standard key) | `GET /v1/models` | None | validation_only |
| Azure OpenAI | Standard key | `GET /openai/models` | None | validation_only |
| Moonshot | Standard key | `GET /v1/models` | None | validation_only |

## Provider-by-provider explanation

### OpenAI (full)

API Lens requires an OpenAI **Admin API key** (prefix `sk-admin-`). Standard project keys are rejected at Zod validation.

Current logic:

- Validation checks that the key starts with `sk-admin-`.
- Validation calls `GET https://api.openai.com/v1/organization/costs` to confirm billing access.
- If the cost endpoint fails, the key is rejected.

What we track:

- Organization cost data per model, per key, per day.
- Managed keys discovered via the admin API.

Why admin keys:

- A key that can generate completions but cannot see organization costs is not useful for API Lens.
- Admin keys provide the full billing surface the product needs.

### Anthropic (full)

API Lens requires an Anthropic **Admin API key** (prefix `sk-ant-admin`). Standard API keys are rejected at Zod validation.

Current logic:

- Validation checks that the key starts with `sk-ant-admin`.
- Validation calls `GET /v1/organizations/usage_report/messages` to confirm usage report access.
- If the usage report request fails, the key is rejected.

What we track:

- Usage report data (tokens, costs) per model, per day.
- Cost report data for dollar-denominated breakdowns.
- Managed keys discovered via the admin API.

Why admin keys:

- A normal Anthropic API key is valid for inference but useless for organization-level monitoring.
- The admin key provides usage reports, cost reports, and key management.

### OpenRouter (aggregate)

OpenRouter accepts **standard API keys** (typically prefix `sk-or-`). No admin key is required.

Current logic:

- Validation calls `GET https://openrouter.ai/api/v1/auth/key` to confirm the key is valid.
- Usage sync first tries `GET https://openrouter.ai/api/v1/activity` with pagination (up to 20 pages of 100 records each).
- Activity records are filtered by date range and aggregated by `(date, model)` into `UsageRow[]` with real token counts and per-model costs.
- If the activity endpoint fails or returns empty, falls back to the aggregate `GET /api/v1/auth/key` endpoint for a single total-usage dollar amount.

What we track:

- Per-model token counts (input + output) and costs from generation history.
- `cost_source: 'api'` for activity-derived data, `cost_source: 'estimated'` for aggregate fallback.

Why this works well:

- The activity endpoint provides genuine per-model breakdown without requiring admin access.
- The aggregate fallback ensures graceful degradation.

### DeepSeek (aggregate)

DeepSeek accepts **standard API keys**. Validation requires access to the balance endpoint.

Current logic:

- Validation first calls `GET /user/balance` to check billing access.
- If balance fails, falls back to checking model list access.
- If both endpoints indicate the key works but balance is inaccessible, the key is rejected.

What we track:

- Account balance and balance-derived spend approximation.

Important limitation:

- This is account-level, not per-model or per-key attribution.
- DeepSeek's public API does not expose per-model billing records.

### ElevenLabs (aggregate)

ElevenLabs accepts **standard or workspace API keys** with usage access.

Current logic:

- Validation first tries `GET /v1/usage/character-stats`.
- If that fails but `GET /v1/user` succeeds, the key is valid for inference but not for usage tracking — it is rejected.

What we track:

- Character usage counts and request counts.

Important limitation:

- This is character-based, not dollar-based billing.
- No per-model cost breakdown.

### Gemini (validation_only)

Gemini accepts **standard Google AI Studio API keys** (typically prefix `AIza`). No admin key exists.

Current logic:

- Validation calls `GET /v1beta/models` to verify the key is valid.
- On HTTP 200, returns `{ valid: true, keyType: 'standard' }`.
- `fetchUsage()` returns success with empty rows — no API call is made.

Why validation-only:

- Google AI Studio does not expose a usage or billing API.
- The key is validated and stored for project organization, but no automated cost sync is possible.
- The UI shows a blue "Validation Only" badge and an info box explaining the limitation.

What would be needed later:

- Google Cloud Billing API integration (requires OAuth2 + service accounts) — a separate future initiative.

### Grok / xAI (validation_only)

Grok accepts **standard xAI API keys** (typically prefix `xai-`). No management key is required.

Current logic:

- Validation calls `GET /v1/models` to verify the key is valid.
- On HTTP 200, returns `{ valid: true, keyType: 'standard' }`.
- `fetchUsage()` returns success with empty rows — no API call is made.

Why validation-only:

- xAI does not yet offer a public usage or billing API.
- xAI's billing and historical usage live behind the Management API, which requires a management key and team context that the current product flow does not collect.
- The UI shows a "Validation Only" badge and an info box explaining the limitation.

What would be needed later:

- Support for xAI Management API keys with team context.
- Team-level usage synchronization.

### Azure OpenAI (validation_only)

Azure OpenAI accepts **standard API keys** with an endpoint URL.

Current logic:

- Validation checks inference access with the provided endpoint + API key.
- `fetchUsage()` returns success with empty rows.

Why validation-only:

- Azure billing is not exposed through simple API key auth.
- Real spend monitoring requires Azure Billing, Azure Monitor, or Cost Management surfaces.

### Moonshot (validation_only)

Moonshot accepts **standard API keys**.

Current logic:

- Validation calls the models endpoint to verify the key.
- `fetchUsage()` returns success with empty rows.

Why validation-only:

- No public usage or billing API has been found for Moonshot.

## Product messaging guidance

Safe claims for the website or investors:

- "API Lens accepts keys from all 9 major AI providers."
- "Full per-model cost tracking for OpenAI and Anthropic. Per-model breakdown for OpenRouter. Balance tracking for DeepSeek."
- "Where a provider lacks a billing API, we validate and store the key with honest messaging — no fabricated capabilities."
- "The sync engine is intelligent — it only calls providers that have usage APIs, avoiding wasted API calls and false failures."

Claims that should stay qualified:

- "Per-key billing everywhere" — only OpenAI and Anthropic support per-key attribution today.
- "Universal cost tracking" — 4 providers are validation-only.

Honest tier summary:

- Full tracking: OpenAI (admin), Anthropic (admin)
- Per-model breakdown: OpenRouter
- Aggregate tracking: DeepSeek, ElevenLabs
- Validation-only: Gemini, Grok, Azure OpenAI, Moonshot

## Official references

- OpenAI quickstart: [platform.openai.com/docs/quickstart/step-2-setup-your-api-key](https://platform.openai.com/docs/quickstart/step-2-setup-your-api-key)
- OpenAI usage and costs API: [platform.openai.com/docs/api-reference/usage/costs](https://platform.openai.com/docs/api-reference/usage/costs?api-mode=responses&lang=curl)
- Anthropic Admin API: [docs.anthropic.com/en/api/administration-api](https://docs.anthropic.com/en/api/administration-api)
- Anthropic Usage and Cost API: [docs.anthropic.com/en/api/usage-cost-api](https://docs.anthropic.com/en/api/usage-cost-api)
- Gemini API keys: [ai.google.dev/gemini-api/docs/api-key](https://ai.google.dev/gemini-api/docs/api-key?authuser=00)
- xAI Management API overview: [docs.x.ai/docs/management-api](https://docs.x.ai/docs/management-api)
- xAI billing management: [docs.x.ai/docs/management-api/billing](https://docs.x.ai/docs/management-api/billing)
- Azure OpenAI quickstart: [learn.microsoft.com/azure/ai-services/openai/chatgpt-quickstart](https://learn.microsoft.com/en-us/azure/ai-services/openai/chatgpt-quickstart?pivots=rest-api&tabs=command-line%2Cjavascript-keyless%2Ctypescript-keyless%2Cpython-new)
- Azure cost management guidance: [learn.microsoft.com/azure/ai-services/plan-manage-costs](https://learn.microsoft.com/en-us/azure/ai-services/plan-manage-costs?view=doc-intel-3.0.0)
- Moonshot quick start blog: [platform.moonshot.cn/blog/posts/kimi-api-quick-start-guide](https://platform.moonshot.cn/blog/posts/kimi-api-quick-start-guide)
- DeepSeek first API call: [api-docs.deepseek.com](https://api-docs.deepseek.com/)
- DeepSeek balance endpoint: [api-docs.deepseek.com/api/get-user-balance](https://api-docs.deepseek.com/api/get-user-balance)
- ElevenLabs authentication: [elevenlabs.io/docs/api-reference/quick-start/authentication](https://elevenlabs.io/docs/api-reference/quick-start/authentication)
- OpenRouter authentication: [openrouter.ai/docs/api/reference/authentication](https://openrouter.ai/docs/api/reference/authentication)
- OpenRouter activity API: [openrouter.ai/docs/api/reference/activity](https://openrouter.ai/docs/api/reference/activity)
