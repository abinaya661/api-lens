import type { ProviderSyncResult } from '@/types';

export async function validateElevenLabsKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey },
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `ElevenLabs API returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchElevenLabsUsage(
  apiKey: string,
  _keyId: string,
  _since?: Date,
): Promise<ProviderSyncResult> {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) {
      return { success: false, usage: [], error: `ElevenLabs subscription API returned ${res.status}` };
    }

    const data = await res.json();
    return { success: true, usage: [], raw_data: data };
  } catch (err) {
    return { success: false, usage: [], error: `Failed to fetch ElevenLabs usage: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}
