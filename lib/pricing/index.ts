// ============================================
// Pricing Engine — Token → USD conversion
// ============================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { PriceSnapshot } from '@/types';

// In-memory cache for pricing data (refreshed every 5 minutes)
let pricingCache: PriceSnapshot[] = [];
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current pricing for all models, with caching.
 */
export async function getCurrentPricing(): Promise<PriceSnapshot[]> {
  const now = Date.now();
  if (pricingCache.length > 0 && now - lastFetch < CACHE_TTL) {
    return pricingCache;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .order('provider')
    .order('model');

  if (error) {
    console.error('Failed to fetch pricing:', error);
    return pricingCache; // Return stale cache on error
  }

  pricingCache = data as PriceSnapshot[];
  lastFetch = now;
  return pricingCache;
}

/**
 * Get pricing for a specific model.
 */
export async function getModelPricing(
  provider: string,
  model: string,
): Promise<PriceSnapshot | null> {
  const pricing = await getCurrentPricing();
  return (
    pricing.find(
      (p) => p.provider === provider && p.model === model,
    ) ?? null
  );
}

/**
 * Calculate cost in USD from token counts.
 * price_snapshots uses per-million-token pricing.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: PriceSnapshot,
): number {
  const inputCost = (inputTokens / 1_000_000) * Number(pricing.input_per_mtok);
  const outputCost = (outputTokens / 1_000_000) * Number(pricing.output_per_mtok);
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

export function calculateCostWithBatch(
  inputTokens: number,
  outputTokens: number,
  pricing: PriceSnapshot,
): number {
  const inputCost =
    (inputTokens / 1_000_000) *
    Number(pricing.batch_input_per_mtok ?? pricing.input_per_mtok);
  const outputCost =
    (outputTokens / 1_000_000) *
    Number(pricing.batch_output_per_mtok ?? pricing.output_per_mtok);

  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function calculateCostWithCache(
  inputTokens: number,
  outputTokens: number,
  pricing: PriceSnapshot,
): number {
  const inputCost =
    (inputTokens / 1_000_000) *
    Number(pricing.cached_input_per_mtok ?? pricing.input_per_mtok);
  const outputCost = (outputTokens / 1_000_000) * Number(pricing.output_per_mtok);

  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Get pricing for a provider's models.
 */
export async function getProviderPricing(provider: string): Promise<PriceSnapshot[]> {
  const pricing = await getCurrentPricing();
  return pricing.filter((p) => p.provider === provider);
}

/**
 * Get all unique models for a provider.
 */
export async function getProviderModels(provider: string): Promise<string[]> {
  const pricing = await getProviderPricing(provider);
  return [...new Set(pricing.map((p) => p.model))];
}
