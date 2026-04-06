import { BaseAdapter } from './base';
import type { SyncResult, UsageRow, ProviderCapabilities } from '../types';

export class ElevenLabsAdapter extends BaseAdapter {
  provider = 'elevenlabs';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const startUnix = Math.floor(new Date(dateFrom).getTime() / 1000);
      const endUnix = Math.floor(new Date(dateTo + 'T23:59:59Z').getTime() / 1000);

      const url = `https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${startUnix}&end_unix=${endUnix}`;
      const res = await fetch(url, {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `ElevenLabs API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      if (Array.isArray(data)) {
        for (const entry of data) {
          const characters = entry.character_count ?? 0;
          rows.push({
            date: entry.date ?? dateFrom,
            model: entry.voice_id ?? 'tts',
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            request_count: entry.request_count ?? 0,
            unit_type: 'characters',
            unit_count: characters,
          });
        }
      } else if (data && typeof data === 'object') {
        const entries = data.usage ?? data.data ?? [];
        for (const entry of Array.isArray(entries) ? entries : []) {
          rows.push({
            date: entry.date ?? dateFrom,
            model: entry.voice_id ?? 'tts',
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            request_count: entry.request_count ?? 0,
            unit_type: 'characters',
            unit_count: entry.character_count ?? 0,
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching ElevenLabs usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 86400;
      const usageRes = await fetch(
        `https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${oneDayAgo}&end_unix=${now}`,
        {
          headers: { 'xi-api-key': apiKey },
        },
      );

      if (usageRes.ok) {
        return { valid: true };
      }

      const userRes = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': apiKey },
      });

      if (userRes.ok) {
        const body = await usageRes.text();
        return {
          valid: false,
          error: `This ElevenLabs key is valid, but API Lens could not access ElevenLabs usage analytics with it. ElevenLabs returned ${usageRes.status}: ${body}`,
        };
      }

      const body = await userRes.text();
      return { valid: false, error: `ElevenLabs returned ${userRes.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  override getCapabilities(): ProviderCapabilities {
    return {
      canValidateKey: true,
      canFetchUsage: true,
      canFetchCost: false,
      canListManagedKeys: false,
      canPerModelBreakdown: false,
      canPerKeyBreakdown: false,
      requiresAdminKey: false,
      usageNote: 'ElevenLabs provides character-based usage stats. Cost estimation uses your plan tier.',
    };
  }
}
