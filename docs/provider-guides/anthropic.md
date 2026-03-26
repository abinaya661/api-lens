# Anthropic Setup Guide for API Lens

## Current API Lens status

Supported, but only with an Anthropic Admin API key.

API Lens will reject a standard Anthropic inference key if it cannot access Anthropic's Usage and Cost API.

## What the user should obtain

- An Anthropic Admin API key starting with `sk-ant-admin...`
- The user must be an organization admin in Anthropic Console

## Step-by-step

1. Sign in to Anthropic Console.
2. Confirm that your account belongs to an Anthropic organization, not just an individual account.
3. Confirm that your role is `admin`.
4. Go to `Console -> Settings -> Organization`.
5. Create or retrieve an Admin API key.
6. Copy the Admin API key immediately and store it safely.
7. Paste the raw admin key into API Lens.
8. Click `Add Key`.

## What API Lens verifies

API Lens currently checks:

- `POST /v1/messages`
- `GET /v1/organizations/usage_report/messages`

The key is only accepted if the usage report call succeeds.

## Common failure reasons

- The user pasted a normal Anthropic API key instead of an Admin API key.
- The account is not an organization admin.
- The Anthropic account is an individual account and does not have Admin API access.
- The key belongs to the wrong organization.

## What to tell the user

If you want Anthropic tracking in API Lens, create an Admin API key, not a normal Claude inference key.

## Official references

- Anthropic Admin API overview: [docs.anthropic.com/en/api/administration-api](https://docs.anthropic.com/en/api/administration-api)
- Anthropic Usage and Cost API: [docs.anthropic.com/en/api/usage-cost-api](https://docs.anthropic.com/en/api/usage-cost-api)
- Anthropic API overview: [docs.anthropic.com/en/api/getting-started](https://docs.anthropic.com/en/api/getting-started)

