import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

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

      // data is typically an array of daily character usage
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
        // Some responses wrap in an object
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
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': apiKey },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `ElevenLabs returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
