# OpenRouter Setup Guide for API Lens

## Current API Lens status

Supported.

OpenRouter is one of the cleanest current providers for API Lens because the provider exposes a current-key endpoint with usage and limit information.

## What the user should obtain

- A standard OpenRouter API key

## Step-by-step

1. Sign in to OpenRouter.
2. Go to the OpenRouter keys area.
3. Create a new API key.
4. Give it a name that makes sense for monitoring, such as `API Lens Production`.
5. Optionally set a credit limit if you want provider-side protection as well.
6. Copy the key immediately and store it safely.
7. Paste the raw key into API Lens.
8. Click `Add Key`.

## What API Lens verifies

API Lens currently checks:

- `GET /api/v1/key`

If that endpoint returns successfully, the key can be accepted.

## What API Lens tracks today

From the current-key endpoint, API Lens can read:

- Current usage
- Daily usage
- Weekly usage
- Monthly usage
- Remaining limit
- Reset behavior

## Common failure reasons

- Wrong key pasted
- Key disabled
- No OpenRouter credit or account issue

## What to tell the user

OpenRouter is a strong provider for demos because the provider gives API Lens a clean per-key monitoring surface.

## Official references

- OpenRouter authentication: [openrouter.ai/docs/api/reference/authentication](https://openrouter.ai/docs/api/reference/authentication)
- OpenRouter API key operations: [openrouter.ai/docs/sdk-reference/python/apikeys](https://openrouter.ai/docs/sdk-reference/python/apikeys)
