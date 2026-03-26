# DeepSeek Setup Guide for API Lens

## Current API Lens status

Supported with limitations.

API Lens currently validates and syncs DeepSeek using the account balance API. That means the integration is usable, but it is closer to account-level billing visibility than clean provider-native per-key attribution.

## What the user should obtain

- A standard DeepSeek API key

## Step-by-step

1. Sign in to DeepSeek's platform.
2. Create or retrieve a DeepSeek API key.
3. Confirm the account has balance available for API use.
4. Copy the API key and store it safely.
5. Paste the raw key into API Lens.
6. Click `Add Key`.

## What API Lens verifies

API Lens currently checks:

- `GET /user/balance`

If that balance call works, the key can be accepted.

## What API Lens tracks today

API Lens currently uses:

- `GET /user/balance`

This gives API Lens an account-level balance signal. It is helpful for billing visibility, but it is not the same as a rich per-key usage report.

## Common failure reasons

- The key is wrong.
- The account has no usable balance.
- The user expects perfect per-key attribution, but DeepSeek's public API surface does not currently match that expectation in the way Anthropic or OpenRouter do.

## What to tell the user

DeepSeek works in API Lens today, but explain that the current tracking story is more balance-based than detailed per-key billing analytics.

## Official references

- DeepSeek first API call: [api-docs.deepseek.com](https://api-docs.deepseek.com/)
- DeepSeek balance endpoint: [api-docs.deepseek.com/api/get-user-balance](https://api-docs.deepseek.com/api/get-user-balance)
- DeepSeek pricing: [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- DeepSeek FAQ: [api-docs.deepseek.com/faq](https://api-docs.deepseek.com/faq)

