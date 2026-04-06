-- Migration 012: Provider capabilities expansion
-- Part A: Add missing provider enum values for new adapters
ALTER TYPE provider_type ADD VALUE IF NOT EXISTS 'grok';
ALTER TYPE provider_type ADD VALUE IF NOT EXISTS 'moonshot';
ALTER TYPE provider_type ADD VALUE IF NOT EXISTS 'deepseek';
ALTER TYPE provider_type ADD VALUE IF NOT EXISTS 'elevenlabs';
ALTER TYPE provider_type ADD VALUE IF NOT EXISTS 'openrouter';

-- Part B: Add usage_capability column to api_keys
-- Tracks what level of usage sync each key supports: full, aggregate, or validation_only
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS usage_capability TEXT NOT NULL DEFAULT 'full';

-- Backfill existing keys based on provider capabilities
UPDATE public.api_keys SET usage_capability = 'full' WHERE provider IN ('openai', 'anthropic');
UPDATE public.api_keys SET usage_capability = 'aggregate' WHERE provider IN ('openrouter', 'deepseek', 'elevenlabs');
UPDATE public.api_keys SET usage_capability = 'validation_only' WHERE provider IN ('gemini', 'grok', 'azure_openai', 'moonshot');
