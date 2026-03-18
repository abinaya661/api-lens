import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class CohereAdapter extends BaseAdapter {
  provider = 'cohere';

  async fetchUsage(apiKey: string, dateFrom: string, _dateTo: string): Promise<SyncResult> {
    try {
      const res = await fetch('https://api.cohere.ai/v1/usage', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // Usage endpoint may not be publicly available
        if (res.status === 404 || res.status === 403) {
          return this.makeSyncResult(this.provider, []);
        }
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `Cohere API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      if (data.usage && Array.isArray(data.usage)) {
        for (const entry of data.usage) {
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
        e instanceof Error ? e.message : 'Unknown error fetching Cohere usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.cohere.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `Cohere returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
