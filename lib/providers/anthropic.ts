// ============================================
// Anthropic Provider Module
// Validates keys and fetches usage data
// ============================================

import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com';

/**
 * Validate an Anthropic API key.
 */
export async function validateAnthropicKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    // A 401 means invalid key, anything else (including success or 429) means key is valid
    if (res.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (res.status === 403) {
      return { valid: false, error: 'Key does not have billing/usage permissions' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

/**
 * Fetch usage data from Anthropic's admin API.
 */
export async function fetchAnthropicUsage(
  apiKey: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  const provider: Provider = 'anthropic';

  try {
    // Anthropic usage API endpoint
    const url = new URL(`${ANTHROPIC_API_BASE}/v1/organizations/usage`);
    if (since) {
      url.searchParams.set('start_date', since.toISOString().split('T')[0]!);
    } else {
      // Default to last 24 hours
      const yesterday = new Date(Date.now() - 86400000);
      url.searchParams.set('start_date', yesterday.toISOString().split('T')[0]!);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return {
        success: false,
        usage: [],
        error: `Anthropic usage API returned ${res.status}: ${errorBody}`,
      };
    }

    const data = await res.json();
    const records = data.data ?? [];

    const usage: NormalizedUsage[] = [];
    const syncedAt = new Date().toISOString();

    for (const record of records) {
      usage.push({
        key_id: keyId,
        provider,
        model: record.model ?? 'unknown',
        input_tokens: record.input_tokens ?? 0,
        output_tokens: record.output_tokens ?? 0,
        cost_usd: 0, // Will be calculated by pricing engine
        recorded_at: record.date ?? syncedAt,
        synced_at: syncedAt,
      });
    }

    return { success: true, usage, raw_data: data };
  } catch (err) {
    return {
      success: false,
      usage: [],
      error: `Failed to fetch Anthropic usage: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
