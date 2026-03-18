import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class MistralAdapter extends BaseAdapter {
  provider = 'mistral';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const url = `https://api.mistral.ai/v1/usage?start_date=${dateFrom}&end_date=${dateTo}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `Mistral API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const entry of data.data) {
          rows.push({
            date: entry.date ?? dateFrom,
            model: entry.model ?? 'unknown',
            input_tokens: entry.input_tokens ?? 0,
            output_tokens: entry.output_tokens ?? 0,
            total_tokens: (entry.input_tokens ?? 0) + (entry.output_tokens ?? 0),
            cost_usd: entry.cost ?? 0,
            request_count: entry.request_count ?? 0,
            unit_type: 'tokens',
            unit_count: (entry.input_tokens ?? 0) + (entry.output_tokens ?? 0),
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching Mistral usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `Mistral returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
