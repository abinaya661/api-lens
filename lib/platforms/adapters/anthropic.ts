import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

interface AnthropicUsageBucket {
  starting_at?: string;
  ending_at?: string;
  results?: Array<{
    model?: string;
    api_key_id?: string;
    uncached_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens?: number;
  }>;
}

export class AnthropicAdapter extends BaseAdapter {
  provider = 'anthropic';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const url = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
      url.searchParams.set('starting_at', `${dateFrom}T00:00:00Z`);
      url.searchParams.set('ending_at', `${dateTo}T23:59:59Z`);
      url.searchParams.append('group_by[]', 'api_key_id');
      url.searchParams.append('group_by[]', 'model');
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.set('limit', '31');

      const res = await fetch(url.toString(), {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `Anthropic usage API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const buckets: AnthropicUsageBucket[] = data.data ?? [];
      const rows: UsageRow[] = [];

      for (const bucket of buckets) {
        const date = bucket.starting_at?.slice(0, 10) ?? dateFrom;
        for (const result of bucket.results ?? []) {
          const inputTokens = (result.uncached_input_tokens ?? 0) + (result.cache_read_input_tokens ?? 0);
          const outputTokens = result.output_tokens ?? 0;

          rows.push({
            date,
            model: result.model ?? 'unknown',
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens,
            cost_usd: 0,
            request_count: 0,
            unit_type: 'tokens',
            unit_count: inputTokens + outputTokens,
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching Anthropic usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const messagesRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });

      if (messagesRes.status === 401 || messagesRes.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized Anthropic API key' };
      }

      const usageUrl = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      usageUrl.searchParams.set('starting_at', yesterday.toISOString());
      usageUrl.searchParams.set('ending_at', now.toISOString());
      usageUrl.searchParams.append('group_by[]', 'api_key_id');
      usageUrl.searchParams.set('bucket_width', '1d');
      usageUrl.searchParams.set('limit', '1');

      const usageRes = await fetch(usageUrl.toString(), {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      if (usageRes.ok) {
        return { valid: true };
      }

      const body = await usageRes.text();
      return {
        valid: false,
        error: `This Anthropic key can make model calls, but API Lens needs an Anthropic Admin API key with Usage & Cost API access. Anthropic returned ${usageRes.status}: ${body}`,
      };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
