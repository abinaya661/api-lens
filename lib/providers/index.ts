// ============================================
// Provider Registry — Central dispatch
// ============================================

import type { Provider, ProviderSyncResult } from '@/types';
import { validateOpenAIKey, fetchOpenAIUsage } from './openai';
import { validateAnthropicKey, fetchAnthropicUsage } from './anthropic';

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
  // TODO: Add remaining providers (gemini, bedrock, mistral, cohere, azure_openai)
  // Each follows the same pattern: validate() + fetchUsage()
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
