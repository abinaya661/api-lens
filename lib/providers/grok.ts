import type { ProviderSyncResult } from '@/types';

export async function validateGrokKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `xAI API returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchGrokUsage(
  _apiKey: string,
  _keyId: string,
  _since?: Date,
): Promise<ProviderSyncResult> {
  // xAI does not expose a public billing/usage API yet.
  return { success: true, usage: [] };
}
