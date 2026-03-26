import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class OpenRouterAdapter extends BaseAdapter {
  provider = 'openrouter';

  async fetchUsage(apiKey: string, dateFrom: string, _dateTo: string): Promise<SyncResult> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `OpenRouter API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      if (data.data) {
        const usage = Number(data.data.usage ?? data.data.usage_monthly ?? 0);

        rows.push({
          date: dateFrom,
          model: 'all-models',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          cost_usd: usage,
          request_count: 0,
          unit_type: 'usd',
          unit_count: usage,
        });
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching OpenRouter usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `OpenRouter returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
