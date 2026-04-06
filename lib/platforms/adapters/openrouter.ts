import { BaseAdapter } from './base';
import type { SyncResult, UsageRow, ProviderCapabilities } from '../types';

interface ActivityGeneration {
  id: string;
  model: string;
  tokens_prompt: number;
  tokens_completion: number;
  total_cost: number;
  created_at: string;
}

export class OpenRouterAdapter extends BaseAdapter {
  provider = 'openrouter';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      // Try the activity endpoint first for per-model breakdown
      const activityRows = await this.fetchActivity(apiKey, dateFrom, dateTo);
      if (activityRows.length > 0) {
        return this.makeSyncResult(this.provider, activityRows);
      }

      // Fall back to aggregate key endpoint
      return this.fetchAggregateUsage(apiKey, dateFrom);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching OpenRouter usage',
      );
    }
  }

  private async fetchActivity(apiKey: string, dateFrom: string, dateTo: string): Promise<UsageRow[]> {
    const dateFromTs = new Date(dateFrom).getTime();
    const dateToTs = new Date(dateTo + 'T23:59:59Z').getTime();
    const allGenerations: ActivityGeneration[] = [];
    let offset = 0;
    const limit = 100;

    // Paginate through activity endpoint
    for (let page = 0; page < 20; page++) {
      const res = await fetch(`https://openrouter.ai/api/v1/activity?offset=${offset}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!res.ok) return []; // Fall back to aggregate

      const data = await res.json();
      const generations: ActivityGeneration[] = data.data ?? [];
      if (generations.length === 0) break;

      for (const gen of generations) {
        const ts = new Date(gen.created_at).getTime();
        if (ts < dateFromTs) return allGenerations.length > 0 ? this.aggregateByDateModel(allGenerations) : [];
        if (ts <= dateToTs) allGenerations.push(gen);
      }

      if (generations.length < limit) break;
      offset += limit;
    }

    return allGenerations.length > 0 ? this.aggregateByDateModel(allGenerations) : [];
  }

  private aggregateByDateModel(generations: ActivityGeneration[]): UsageRow[] {
    const buckets = new Map<string, {
      input_tokens: number;
      output_tokens: number;
      cost_usd: number;
      request_count: number;
    }>();

    for (const gen of generations) {
      const date = gen.created_at.slice(0, 10); // YYYY-MM-DD
      const key = `${date}|${gen.model}`;
      const bucket = buckets.get(key) ?? { input_tokens: 0, output_tokens: 0, cost_usd: 0, request_count: 0 };
      bucket.input_tokens += gen.tokens_prompt ?? 0;
      bucket.output_tokens += gen.tokens_completion ?? 0;
      bucket.cost_usd += gen.total_cost ?? 0;
      bucket.request_count += 1;
      buckets.set(key, bucket);
    }

    const rows: UsageRow[] = [];
    for (const [key, bucket] of buckets) {
      const parts = key.split('|');
      const date = parts[0] ?? '';
      const model = parts[1] ?? '';
      rows.push({
        date,
        model,
        input_tokens: bucket.input_tokens,
        output_tokens: bucket.output_tokens,
        total_tokens: bucket.input_tokens + bucket.output_tokens,
        cost_usd: bucket.cost_usd,
        request_count: bucket.request_count,
        unit_type: 'tokens',
        unit_count: bucket.input_tokens + bucket.output_tokens,
        cost_source: 'api',
      });
    }

    return rows;
  }

  private async fetchAggregateUsage(apiKey: string, dateFrom: string): Promise<SyncResult> {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return this.makeSyncResult(this.provider, [], `OpenRouter API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const rows: UsageRow[] = [];

    if (data.data) {
      const usage = Number(data.data.usage ?? 0);
      if (usage > 0) {
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
          cost_source: 'estimated',
        });
      }
    }

    return this.makeSyncResult(this.provider, rows);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true, keyType: 'standard' };
      }

      const body = await res.text();
      return { valid: false, error: `OpenRouter returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  override getCapabilities(): ProviderCapabilities {
    return {
      canValidateKey: true,
      canFetchUsage: true,
      canFetchCost: true,
      canListManagedKeys: false,
      canPerModelBreakdown: true,
      canPerKeyBreakdown: false,
      requiresAdminKey: false,
      usageNote: 'OpenRouter provides per-model cost and token breakdown via generation history.',
    };
  }
}
