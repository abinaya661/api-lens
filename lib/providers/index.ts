// ============================================
// Provider Registry — Central dispatch
// ============================================

import type { Provider, ProviderSyncResult } from '@/types';
import { validateOpenAIKey, fetchOpenAIUsage } from './openai';
import { validateAnthropicKey, fetchAnthropicUsage } from './anthropic';
import { validateMistralKey, fetchMistralUsage } from './mistral';
import { validateCohereKey, fetchCohereUsage } from './cohere';
import { validateAzureOpenAI, fetchAzureOpenAIUsage } from './azure_openai';
import { validateGemini, fetchGeminiUsage } from './gemini';
import { validateBedrock, fetchBedrockUsage } from './bedrock';

export interface ProviderModule {
  validate: (credentials: Record<string, string>) => Promise<{ valid: boolean; error?: string }>;
  fetchUsage: (credentials: Record<string, string>, keyId: string, since?: Date) => Promise<ProviderSyncResult>;
}

const providers: Partial<Record<Provider, ProviderModule>> = {
  openai: {
    validate: (creds) => validateOpenAIKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchOpenAIUsage(creds.api_key ?? '', keyId, since),
  },
  anthropic: {
    validate: (creds) => validateAnthropicKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchAnthropicUsage(creds.api_key ?? '', keyId, since),
  },
  mistral: {
    validate: (creds) => validateMistralKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchMistralUsage(creds.api_key ?? '', keyId, since),
  },
  cohere: {
    validate: (creds) => validateCohereKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchCohereUsage(creds.api_key ?? '', keyId, since),
  },
  azure_openai: {
    validate: (creds) => validateAzureOpenAI(creds.api_key ?? '', creds.endpoint ?? '', creds.subscription_id ?? ''),
    fetchUsage: (creds, keyId, since) => fetchAzureOpenAIUsage(creds.api_key ?? '', creds.endpoint ?? '', creds.subscription_id ?? '', keyId, since),
  },
  gemini: {
    validate: (creds) => validateGemini(creds.service_account_json ?? '', creds.project_id ?? ''),
    fetchUsage: (creds, keyId, since) => fetchGeminiUsage(creds.service_account_json ?? '', creds.project_id ?? '', keyId, since),
  },
  bedrock: {
    validate: (creds) => validateBedrock(creds.aws_access_key_id ?? '', creds.aws_secret_access_key ?? '', creds.aws_region ?? ''),
    fetchUsage: (creds, keyId, since) => fetchBedrockUsage(creds.aws_access_key_id ?? '', creds.aws_secret_access_key ?? '', creds.aws_region ?? '', keyId, since),
  },
};

/**
 * Get the provider module for a given platform.
 */
export function getProviderModule(provider: Provider): ProviderModule | null {
  return providers[provider] ?? null;
}

/**
 * Check if a provider has an implemented module.
 */
export function isProviderSupported(provider: Provider): boolean {
  return provider in providers || provider === 'custom';
}

/**
 * List all providers with their implementation status.
 */
export function getProviderStatus(): Array<{ provider: Provider; implemented: boolean }> {
  const allProviders: Provider[] = [
    'openai', 'anthropic', 'gemini', 'bedrock',
    'mistral', 'cohere', 'azure_openai', 'custom',
  ];
  return allProviders.map((p) => ({
    provider: p,
    implemented: p in providers || p === 'custom',
  }));
}
