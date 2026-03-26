# Provider Backend Logic Explainer

This document explains, in plain English, how API Lens currently verifies keys and how it tracks usage or billing for each provider.

It is written for product, marketing, investor conversations, and internal planning.

## Global flow

When a user adds a key:

1. The UI sends the selected provider and the pasted credential to the backend.
2. The backend checks that the provider is one of the supported provider enums.
3. The backend loads the provider-specific adapter from `lib/platforms/registry.ts`.
4. The adapter runs a provider-specific verification flow.
5. The key is only stored if verification proves both:
   - the credential is valid for that provider, and
   - API Lens can use that credential for usage or billing tracking in the way the current product expects.
6. On success the key is encrypted before storage and marked as validated.
7. On failure the key is rejected and not stored.

## Provider matrix

| Provider | Credential API Lens accepts today | Verification surface | Tracking surface | What we track today | Status |
| --- | --- | --- | --- | --- | --- |
| OpenAI | Standard API key with cost access | `GET /v1/models` and `GET /v1/organization/costs` | `GET /v1/organization/costs` | Organization cost data visible to that key | Supported |
| Anthropic | Admin API key | `POST /v1/messages` and `GET /v1/organizations/usage_report/messages` | `GET /v1/organizations/usage_report/messages` | Usage report data from the Anthropic Usage & Cost API | Supported |
| Gemini | None in current flow | Models endpoint can validate the key, but that is not enough | No compatible key-scoped billing endpoint in the current flow | Nothing, key is rejected | Not ready |
| Grok / xAI | None in current flow | Inference key can validate against model access, but that is not enough | xAI billing and usage live behind the Management API and team context | Nothing, key is rejected | Not ready |
| Azure OpenAI | None in current flow | Endpoint plus API key can validate inference access | Cost tracking lives in Azure billing and monitoring surfaces, not plain key auth | Nothing, key is rejected | Not ready |
| Moonshot | None in current flow | Inference key can validate against models | No public usage or billing API confirmed for the current product flow | Nothing, key is rejected | Not ready |
| DeepSeek | Standard API key | `GET /user/balance` | `GET /user/balance` | Account balance and balance-derived spend approximation | Supported with limitations |
| ElevenLabs | Standard or workspace/service-account API key with usage access | `GET /v1/usage/character-stats`, fallback `GET /v1/user` | `GET /v1/usage/character-stats` | Character usage and request counts | Supported |
| OpenRouter | Standard API key | `GET /api/v1/key` | `GET /api/v1/key` | Current key usage, limits, and remaining budget | Supported |

## Provider-by-provider explanation

### OpenAI

API Lens treats OpenAI as supported only when the key can access both model inference and OpenAI's usage or cost surface.

Current logic:

- Validation first checks `GET https://api.openai.com/v1/models`.
- Validation then checks `GET https://api.openai.com/v1/organization/costs`.
- If the second call fails, the key is rejected instead of being added with a warning.

Why this matters:

- A key that can generate completions but cannot see usage or cost data is not useful for API Lens.
- The product promise is "trackable or reject," so OpenAI keys now follow that rule.

Current limitation:

- The current implementation reads the cost surface available to the authenticated key.
- It does not yet reconcile OpenAI's provider-native API key ID objects into our own database model.

### Anthropic

Anthropic is supported only through the Admin API route.

Current logic:

- Validation checks that the key can make a normal Messages API request.
- Validation then calls Anthropic's Usage & Cost API at `/v1/organizations/usage_report/messages`.
- If that usage report request fails, the key is rejected.

Why this matters:

- A normal Anthropic API key may be valid for inference but still be useless for organization-level monitoring.
- API Lens therefore requires an Anthropic Admin API key for the current product story.

Current limitation:

- This is the right enterprise story, but it excludes individual accounts and non-admin users.

### Gemini

Gemini is documented but intentionally rejected in the current add-key flow.

Current logic:

- We can verify that a Gemini key exists by hitting Google's model list endpoint.
- We do not have a provider-specific billing or usage endpoint that fits the current "paste one key and track that key" product flow.

Why it is rejected:

- Valid for inference is not enough.
- The current product needs a trackable billing surface before it should store the key.

What would be needed later:

- A more complete Google Cloud billing integration, potentially involving project context, billing exports, or service-account based access.

### Grok / xAI

Grok is documented but intentionally rejected in the current add-key flow.

Current logic:

- A normal xAI inference key can be valid for calling models.
- xAI's billing and historical usage APIs live in the Management API, which requires a management key and team context.

Why it is rejected:

- The current UI only collects one provider credential string.
- That is not enough to support xAI's management-key plus team-level usage model.

What would be needed later:

- Support for xAI Management API keys.
- Support for storing a `team_id`.
- Support for team-level usage synchronization.

### Azure OpenAI

Azure OpenAI is documented but intentionally rejected in the current add-key flow.

Current logic:

- We can validate inference access with `endpoint|api-key`.
- That only proves the resource can answer model calls.

Why it is rejected:

- Azure billing is not exposed the same way as a plain OpenAI-compatible inference key.
- Real spend monitoring usually requires Azure billing, Azure Monitor, or Cost Management surfaces outside the simple key-based flow.

What would be needed later:

- A richer Azure integration that captures endpoint, subscription, tenant, and billing context.

### Moonshot

Moonshot is documented but intentionally rejected in the current add-key flow.

Current logic:

- We can validate that a Moonshot key can list models.
- We did not find a public usage or billing API that fits the current product model.

Why it is rejected:

- Without a trackable provider-side usage surface, storing the key would break the product promise.

What would be needed later:

- A documented public usage or billing API from Moonshot, or a supported export workflow we can automate.

### DeepSeek

DeepSeek is supported, but only with a clear limitation.

Current logic:

- Validation prefers `GET /user/balance`.
- Sync also uses `GET /user/balance`.
- We derive an account-level spend approximation from balance changes.

Why this is useful:

- It gives API Lens a real billing signal and lets us reject keys that cannot see balance data.

Important limitation:

- DeepSeek's public API surface does not currently give us clean per-key billing records in the same way Anthropic or OpenRouter do.
- The current implementation is therefore more account-level than true per-key attribution.

### ElevenLabs

ElevenLabs is supported when the key can access usage analytics.

Current logic:

- Validation first tries `GET /v1/usage/character-stats`.
- If that fails but `GET /v1/user` succeeds, the key is considered valid but not usable for API Lens, and is rejected.
- Sync uses `GET /v1/usage/character-stats`.

What we track:

- Character usage.
- Request counts when present.

Important limitation:

- This is not a clean per-model dollar billing API.
- It is strongest as a usage monitoring story and may need pricing logic layered on top for polished spend reporting.

### OpenRouter

OpenRouter is one of the cleanest integrations in the current product.

Current logic:

- Validation uses `GET /api/v1/key`.
- Sync also uses `GET /api/v1/key`.

What we track:

- Current key usage.
- Daily, weekly, and monthly usage values when available.
- Limits and remaining quota.

Why it works well:

- The endpoint is already scoped to the currently authenticated key.
- That matches the API Lens product model very closely.

## Product messaging guidance

Safe claims for the website or investors:

- "API Lens only stores a key after provider-specific verification confirms the key is usable for tracking."
- "We support providers where the credential can be tied to a real usage or billing surface."
- "Where a provider only exposes inference access, we reject the key instead of pretending tracking exists."

Claims that should stay qualified:

- "Per-key billing everywhere."
- "Universal support for every LLM provider."

Right now, the honest message is:

- Strongest support: OpenAI, Anthropic Admin, OpenRouter, ElevenLabs.
- Partial support: DeepSeek.
- Documented but intentionally blocked pending better integrations: Gemini, xAI, Azure OpenAI, Moonshot.

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
- DeepSeek FAQ: [api-docs.deepseek.com/faq](https://api-docs.deepseek.com/faq)
- ElevenLabs authentication: [elevenlabs.io/docs/api-reference/quick-start/authentication](https://elevenlabs.io/docs/api-reference/quick-start/authentication)
- ElevenLabs workspace service accounts: [elevenlabs.io/docs/overview/administration/workspaces/service-accounts](https://elevenlabs.io/docs/overview/administration/workspaces/service-accounts)
- OpenRouter authentication: [openrouter.ai/docs/api/reference/authentication](https://openrouter.ai/docs/api/reference/authentication)
- OpenRouter API key operations: [openrouter.ai/docs/sdk-reference/python/apikeys](https://openrouter.ai/docs/sdk-reference/python/apikeys)
