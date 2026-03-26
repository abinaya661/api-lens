# ElevenLabs Setup Guide for API Lens

## Current API Lens status

Supported.

API Lens works best with an ElevenLabs key that can access usage analytics endpoints. For company or workspace use, a workspace or service-account key is the best fit.

## What the user should obtain

Recommended:

- A workspace or service-account API key with usage access

Acceptable for basic testing:

- A normal ElevenLabs API key if it can access usage analytics

## Step-by-step for workspace or service-account usage

1. Sign in to ElevenLabs.
2. If you use a shared team setup, open the workspace you want to monitor.
3. Click your profile icon.
4. Open `Workspace settings`.
5. Go to the `Service Accounts` tab.
6. Create or select a service account.
7. Issue a new API key for that service account.
8. Make sure the key has the permissions needed for the usage endpoints.
9. Copy the `xi-api-key` value immediately and store it safely.
10. Paste it into API Lens.

## What API Lens verifies

API Lens currently checks:

- `GET /v1/usage/character-stats`
- fallback `GET /v1/user`

If the key is valid but cannot access usage analytics, API Lens will reject it.

## What API Lens tracks today

- Character usage
- Request counts when present

## Common failure reasons

- The key is valid but too restricted.
- The key does not have access to usage analytics.
- The user is using a personal key when a workspace or service-account key would be more appropriate.

## What to tell the user

For company-wide tracking, prefer a workspace or service-account key, not a random personal key.

## Official references

- ElevenLabs API authentication: [elevenlabs.io/docs/api-reference/quick-start/authentication](https://elevenlabs.io/docs/api-reference/quick-start/authentication)
- ElevenLabs service accounts: [elevenlabs.io/docs/overview/administration/workspaces/service-accounts](https://elevenlabs.io/docs/overview/administration/workspaces/service-accounts)
- ElevenLabs create service-account key: [elevenlabs.io/docs/api-reference/service-accounts/api-keys/create](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create)
