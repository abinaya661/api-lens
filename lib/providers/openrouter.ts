import type { ProviderSyncResult } from '@/types';

export async function validateOpenRouterKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `OpenRouter API returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchOpenRouterUsage(
  apiKey: string,
  _keyId: string,
  _since?: Date,
): Promise<ProviderSyncResult> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return { success: false, usage: [], error: `OpenRouter API returned ${res.status}` };
    }

    const data = await res.json();
    return { success: true, usage: [], raw_data: data };
  } catch (err) {
    return { success: false, usage: [], error: `Failed to fetch OpenRouter usage: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}
