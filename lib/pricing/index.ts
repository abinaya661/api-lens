// ============================================
// Pricing Engine — Token → USD conversion
// ============================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { Provider, ModelPricing } from '@/types';

// In-memory cache for pricing data (refreshed every 5 minutes)
let pricingCache: ModelPricing[] = [];
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current pricing for all models, with caching.
 */
export async function getCurrentPricing(): Promise<ModelPricing[]> {
  const now = Date.now();
  if (pricingCache.length > 0 && now - lastFetch < CACHE_TTL) {
    return pricingCache;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('model_pricing')
    .select('*')
    .eq('is_current', true)
    .order('provider')
    .order('model_id');

  if (error) {
    console.error('Failed to fetch pricing:', error);
    return pricingCache; // Return stale cache on error
  }

  pricingCache = data as ModelPricing[];
  lastFetch = now;
  return pricingCache;
}

/**
 * Get pricing for a specific model.
 */
export async function getModelPricing(
  provider: Provider,
  modelId: string,
): Promise<ModelPricing | null> {
  const pricing = await getCurrentPricing();
  return (
    pricing.find(
      (p) => p.provider === provider && p.model_id === modelId,
    ) ?? null
  );
}

/**
 * Calculate cost in USD from token counts.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing,
): number {
  const inputCost = (inputTokens / 1000) * pricing.input_price_per_1k;
  const outputCost = (outputTokens / 1000) * pricing.output_price_per_1k;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

/**
 * Get pricing for a provider's models.
 */
export async function getProviderPricing(provider: Provider): Promise<ModelPricing[]> {
  const pricing = await getCurrentPricing();
  return pricing.filter((p) => p.provider === provider);
}

/**
 * Get all unique models for a provider.
 */
export async function getProviderModels(provider: Provider): Promise<string[]> {
  const pricing = await getProviderPricing(provider);
  return [...new Set(pricing.map((p) => p.model_id))];
}
