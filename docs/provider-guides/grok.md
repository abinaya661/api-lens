# Grok / xAI Setup Guide for API Lens

## Current API Lens status

Not ready in the current one-key add flow.

The main reason is that xAI's usage and billing tracking live behind the Management API, which is separate from the normal inference API key.

## What exists on the xAI side

xAI has two relevant credential types:

- A normal API key for inference
- A Management API key for team-level administration and billing operations

## Step-by-step for the normal API key

1. Sign in to xAI Console.
2. Go to the API Keys page.
3. Create a standard API key.
4. Copy it and store it safely.

## Step-by-step for the Management API key

1. In xAI Console, open `Settings -> Management Keys`.
2. Create a Management API key.
3. Make sure your account has the right permissions to use Management Keys.
4. Copy the Management API key immediately.
5. Keep track of the relevant `teamId` because xAI billing endpoints are team-scoped.

## Important note for API Lens

Do not treat Grok as ready in the current dashboard flow.

Why:

- The current UI only collects one provider credential string.
- xAI tracking really needs management-key access and team context.

## What to tell the user

If the user only has a normal xAI inference key, that is not enough for API Lens billing tracking today.

## Official references

- xAI getting started: [docs.x.ai/docs/tutorial](https://docs.x.ai/docs/tutorial)
- xAI Management API overview: [docs.x.ai/docs/management-api](https://docs.x.ai/docs/management-api)
- xAI billing management: [docs.x.ai/docs/management-api/billing](https://docs.x.ai/docs/management-api/billing)
