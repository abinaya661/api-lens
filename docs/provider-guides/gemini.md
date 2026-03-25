# Gemini Setup Guide for API Lens

## Current API Lens status

Not ready in the current key-based flow.

Google Gemini API keys are easy to create, but API Lens does not currently accept them because the current product flow does not yet have the right billing or usage integration for Gemini.

## What the user can obtain today

- A Gemini API key from Google AI Studio

## Step-by-step to create the key

1. Sign in to Google AI Studio.
2. Open the Gemini API key page.
3. Create a new Gemini API key.
4. Copy the key and store it safely.

## Important note for API Lens

Do not market this as a working add-key path yet.

Why:

- API Lens can validate that the Gemini key exists.
- API Lens does not yet have a provider-side billing or usage surface in the current flow that is strong enough for honest "trackable key" support.

## What to tell the user

You can create a Gemini API key, but API Lens should currently reject it until we ship a fuller Google billing integration.

## Official references

- Gemini API quickstart: [ai.google.dev/gemini-api/docs/quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- Gemini API key guide: [ai.google.dev/gemini-api/docs/api-key](https://ai.google.dev/gemini-api/docs/api-key?authuser=00)
- Gemini token usage guide: [ai.google.dev/gemini-api/docs/tokens](https://ai.google.dev/gemini-api/docs/tokens)

