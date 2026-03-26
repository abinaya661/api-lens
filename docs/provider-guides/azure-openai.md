# Azure OpenAI Setup Guide for API Lens

## Current API Lens status

Not ready in the current one-field key flow.

Azure OpenAI can be validated for inference with an endpoint and API key, but real billing and usage tracking requires a richer Azure integration than the current dashboard accepts.

## What exists on the Azure side

Azure gives you:

- An endpoint
- One or more API keys
- Azure billing and cost monitoring through Azure portal surfaces

## Step-by-step to obtain the inference credentials

1. Sign in to Azure portal.
2. Open your Azure OpenAI resource.
3. Go to `Keys & Endpoint`.
4. Copy the endpoint.
5. Copy either `KEY1` or `KEY2`.
6. If you are testing against the current implementation, combine them as `endpoint|api-key`.

## Important note for API Lens

Do not treat Azure OpenAI as ready for honest billing tracking in the current product flow.

Why:

- Endpoint plus key proves inference access.
- It does not solve Azure billing access.
- Real usage and spend monitoring usually needs Azure billing, cost, or monitoring context beyond the plain API key.

## What to tell the user

Azure OpenAI support needs a more advanced integration before it should be offered as a production-ready add-key option.

## Official references

- Azure OpenAI quickstart: [learn.microsoft.com/azure/ai-services/openai/chatgpt-quickstart](https://learn.microsoft.com/en-us/azure/ai-services/openai/chatgpt-quickstart?pivots=rest-api&tabs=command-line%2Cjavascript-keyless%2Ctypescript-keyless%2Cpython-new)
- Azure cost management guidance: [learn.microsoft.com/azure/ai-services/plan-manage-costs](https://learn.microsoft.com/en-us/azure/ai-services/plan-manage-costs?view=doc-intel-3.0.0)

