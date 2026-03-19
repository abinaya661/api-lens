import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

export async function validateCohereKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.cohere.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `Cohere API returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchCohereUsage(
  apiKey: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  // Cohere usage is typically tracked via their dashboard, not exposed via API yet.
  return { success: true, usage: [], error: 'Cohere API does not expose usage endpoints yet.' };
}
