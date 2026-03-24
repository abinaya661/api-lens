import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class OpenAIAdapter extends BaseAdapter {
  provider = 'openai';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const startTime = Math.floor(new Date(dateFrom).getTime() / 1000);
      const endTime = Math.floor(new Date(dateTo + 'T23:59:59Z').getTime() / 1000);

      const url = `https://api.openai.com/v1/organization/costs?start_time=${startTime}&end_time=${endTime}&group_by[]=line_item`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `OpenAI API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const result of data.results) {
          const costUsd = result.amount?.value ?? 0;
          const model = result.line_item ?? 'unknown';

          rows.push({
            date: dateFrom,
            model,
            input_tokens: result.input_tokens ?? 0,
            output_tokens: result.output_tokens ?? 0,
            total_tokens: (result.input_tokens ?? 0) + (result.output_tokens ?? 0),
            cost_usd: costUsd,
            request_count: result.num_requests ?? 0,
            unit_type: 'tokens',
            unit_count: (result.input_tokens ?? 0) + (result.output_tokens ?? 0),
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching OpenAI usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // First check basic validity
      const modelsRes = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!modelsRes.ok) {
        const body = await modelsRes.text();
        return { valid: false, error: `OpenAI returned ${modelsRes.status}: ${body}` };
      }

      // Then verify billing/admin access via the costs endpoint
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 86400;
      const billingRes = await fetch(
        `https://api.openai.com/v1/organization/costs?start_time=${oneDayAgo}&end_time=${now}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
      );

      if (!billingRes.ok) {
        // Key is valid but doesn't have billing access — we still accept it
        // but flag it so the user knows usage sync may be limited
        return { valid: true, error: 'Key is valid but may not have billing access. Usage tracking may be limited.' };
      }

      return { valid: true };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
