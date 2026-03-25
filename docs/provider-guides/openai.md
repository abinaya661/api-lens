# OpenAI Setup Guide for API Lens

## Current API Lens status

Supported.

API Lens expects a standard OpenAI API key that can do two things:

1. Call the normal model API.
2. Access OpenAI's usage or cost API.

If the key can do inference but cannot access usage or cost data, API Lens will reject it.

## What the user should obtain

- A standard OpenAI API key copied from the OpenAI dashboard.
- The key should belong to the same OpenAI organization and project whose spend you want API Lens to monitor.

## Step-by-step

1. Sign in to your OpenAI account.
2. Make sure you are in the correct organization and project.
3. Confirm the project has billing enabled and is the one you actually use for API traffic.
4. Go to the OpenAI dashboard API key area and create a new API key.
5. Give the key a clear name such as `API Lens Production` or `API Lens Finance Monitor`.
6. Copy the key immediately and store it safely.
7. Paste the raw `sk-...` key into API Lens.
8. Click `Add Key`.

## What API Lens verifies

API Lens currently checks:

- `GET /v1/models`
- `GET /v1/organization/costs`

The key is only accepted if both checks pass.

## Common failure reasons

- The key was created in the wrong organization or project.
- The key can run inference but cannot access usage or cost data.
- Billing is not active on the OpenAI side.
- The user copied the wrong key or an expired key.

## What to tell the user

Use a real OpenAI API key from the project that is generating spend. If API Lens rejects the key, create or use a key from the correct organization or project context and try again.

## Official references

- OpenAI quickstart: [platform.openai.com/docs/quickstart/step-2-setup-your-api-key](https://platform.openai.com/docs/quickstart/step-2-setup-your-api-key)
- OpenAI usage and costs API: [platform.openai.com/docs/api-reference/usage/costs](https://platform.openai.com/docs/api-reference/usage/costs?api-mode=responses&lang=curl)
- OpenAI project API keys: [platform.openai.com/docs/api-reference/project-api-keys/list](https://platform.openai.com/docs/api-reference/project-api-keys/list)

