import type { ProviderSyncResult } from '@/types';

export async function validateMistralKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `Mistral API returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchMistralUsage(
  _apiKey: string,
  _keyId: string,
  _since?: Date,
): Promise<ProviderSyncResult> {
  // Mistral does not currently provide a public programmatic usage API.
  // In a production environment without a proxy, we fallback to zero.
  return { success: true, usage: [], error: 'Mistral API does not expose usage endpoints yet.' };
}
