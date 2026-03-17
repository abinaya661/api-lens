// ============================================
// OpenAI Provider Module
// Validates keys and fetches usage data
// ============================================

import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface OpenAIUsageBucket {
  start_time: number;
  end_time: number;
  results: Array<{
    object: string;
    input_tokens: number;
    output_tokens: number;
    num_model_requests: number;
    project_id: string | null;
    user_id: string | null;
    api_key_id: string | null;
    model: string;
    batch: boolean;
  }>;
}

/**
 * Validate an OpenAI API key by attempting to list models.
 */
export async function validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (res.status === 403) {
      return { valid: false, error: 'Key does not have sufficient permissions. An admin key is required.' };
    }
    if (!res.ok) {
      return { valid: false, error: `OpenAI API returned status ${res.status}` };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

/**
 * Fetch usage data from OpenAI's usage API.
 * Returns normalized usage records.
 */
export async function fetchOpenAIUsage(
  apiKey: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  const provider: Provider = 'openai';

  try {
    // Default to last 24 hours if no since date
    const startTime = since
      ? Math.floor(since.getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 86400;

    const url = new URL(`${OPENAI_API_BASE}/organization/usage/completions`);
    url.searchParams.set('start_time', startTime.toString());
    url.searchParams.set('bucket_width', '1d');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return {
        success: false,
        usage: [],
        error: `OpenAI usage API returned ${res.status}: ${errorBody}`,
      };
    }

    const data = await res.json();
    const buckets: OpenAIUsageBucket[] = data.data ?? [];

    const usage: NormalizedUsage[] = [];
    const syncedAt = new Date().toISOString();

    for (const bucket of buckets) {
      for (const result of bucket.results) {
        usage.push({
          key_id: keyId,
          provider,
          model: result.model,
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
          cost_usd: 0, // Will be calculated by pricing engine
          recorded_at: new Date(bucket.start_time * 1000).toISOString(),
          synced_at: syncedAt,
        });
      }
    }

    return { success: true, usage, raw_data: data };
  } catch (err) {
    return {
      success: false,
      usage: [],
      error: `Failed to fetch OpenAI usage: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
