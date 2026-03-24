import type { ProviderSyncResult } from '@/types';

export async function validateDeepSeekKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check balance endpoint first (billing access)
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid API key' };
    if (res.ok) return { valid: true };

    // Fall back to models endpoint
    const modelsRes = await fetch('https://api.deepseek.com/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (modelsRes.ok) return { valid: true };
    return { valid: false, error: `DeepSeek API returned status ${modelsRes.status}` };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchDeepSeekUsage(
  apiKey: string,
  _keyId: string,
  _since?: Date,
): Promise<ProviderSyncResult> {
  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, usage: [], error: `DeepSeek balance API returned ${res.status}` };
    }

    const data = await res.json();
    // DeepSeek returns balance info; usage tracking is limited to balance changes
    return { success: true, usage: [], raw_data: data };
  } catch (err) {
    return { success: false, usage: [], error: `Failed to fetch DeepSeek usage: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}
