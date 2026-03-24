// ============================================
// Provider Registry — Central dispatch
// ============================================

import type { Provider, ProviderSyncResult } from '@/types';
import { validateOpenAIKey, fetchOpenAIUsage } from './openai';
import { validateAnthropicKey, fetchAnthropicUsage } from './anthropic';
import { validateGemini, fetchGeminiUsage } from './gemini';
import { validateGrokKey, fetchGrokUsage } from './grok';
import { validateAzureOpenAI, fetchAzureOpenAIUsage } from './azure_openai';
import { validateMoonshotKey, fetchMoonshotUsage } from './moonshot';
import { validateDeepSeekKey, fetchDeepSeekUsage } from './deepseek';
import { validateElevenLabsKey, fetchElevenLabsUsage } from './elevenlabs';
import { validateOpenRouterKey, fetchOpenRouterUsage } from './openrouter';

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
  gemini: {
    validate: (creds) => validateGemini(creds.service_account_json ?? '', creds.project_id ?? ''),
    fetchUsage: (creds, keyId, since) => fetchGeminiUsage(creds.service_account_json ?? '', creds.project_id ?? '', keyId, since),
  },
  grok: {
    validate: (creds) => validateGrokKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchGrokUsage(creds.api_key ?? '', keyId, since),
  },
  azure_openai: {
    validate: (creds) => validateAzureOpenAI(creds.api_key ?? '', creds.endpoint ?? '', creds.subscription_id ?? ''),
    fetchUsage: (creds, keyId, since) => fetchAzureOpenAIUsage(creds.api_key ?? '', creds.endpoint ?? '', creds.subscription_id ?? '', keyId, since),
  },
  moonshot: {
    validate: (creds) => validateMoonshotKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchMoonshotUsage(creds.api_key ?? '', keyId, since),
  },
  deepseek: {
    validate: (creds) => validateDeepSeekKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchDeepSeekUsage(creds.api_key ?? '', keyId, since),
  },
  elevenlabs: {
    validate: (creds) => validateElevenLabsKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchElevenLabsUsage(creds.api_key ?? '', keyId, since),
  },
  openrouter: {
    validate: (creds) => validateOpenRouterKey(creds.api_key ?? ''),
    fetchUsage: (creds, keyId, since) => fetchOpenRouterUsage(creds.api_key ?? '', keyId, since),
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
  return provider in providers;
}

/**
 * List all providers with their implementation status.
 */
export function getProviderStatus(): Array<{ provider: Provider; implemented: boolean }> {
  const allProviders: Provider[] = [
    'openai', 'anthropic', 'gemini', 'grok',
    'azure_openai', 'moonshot', 'deepseek',
    'elevenlabs', 'openrouter',
  ];
  return allProviders.map((p) => ({
    provider: p,
    implemented: p in providers,
  }));
}
