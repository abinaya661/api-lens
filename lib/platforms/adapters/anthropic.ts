import { BaseAdapter } from './base';
import type { SyncResult, UsageRow, ManagedKeyInfo } from '../types';
import { getModelPricing, calculateCost, calculateCostWithCache } from '@/lib/pricing';

interface AnthropicUsageResult {
  model?: string;
  api_key_id?: string;
  uncached_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  output_tokens?: number;
}

interface IntermediateRow {
  date: string;
  estimatedCost: number;
  result: AnthropicUsageResult;
}

export class AnthropicAdapter extends BaseAdapter {
  provider = 'anthropic';

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }> {
    if (!apiKey.startsWith('sk-ant-admin')) {
      return {
        valid: false,
        error: 'Anthropic requires an Admin API key (starts with sk-ant-admin...). Create one at console.anthropic.com → Settings → API Keys. Only organization admins can create these.',
      };
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };

    try {
      const usageUrl = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
      usageUrl.searchParams.set('starting_at', yesterday.toISOString());
      usageUrl.searchParams.set('ending_at', now.toISOString());
      usageUrl.searchParams.set('bucket_width', '1d');
      usageUrl.searchParams.set('limit', '1');

      const usageRes = await fetch(usageUrl.toString(), { headers });
      if (usageRes.ok) return { valid: true, keyType: 'admin' };

      const costUrl = new URL('https://api.anthropic.com/v1/organizations/cost_report');
      costUrl.searchParams.set('starting_at', yesterday.toISOString());
      costUrl.searchParams.set('ending_at', now.toISOString());
      costUrl.searchParams.set('bucket_width', '1d');
      costUrl.searchParams.set('limit', '1');

      const costRes = await fetch(costUrl.toString(), { headers });
      if (costRes.ok) return { valid: true, keyType: 'admin' };

      const body = await costRes.text();
      return { valid: false, error: `Admin API key validation failed. Anthropic returned ${costRes.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  private async fetchUsageReport(
    apiKey: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<Array<{ date: string; result: AnthropicUsageResult }>> {
    const rows: Array<{ date: string; result: AnthropicUsageResult }> = [];
    const headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    let afterId: string | undefined;

    do {
      const url = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
      url.searchParams.set('starting_at', `${dateFrom}T00:00:00Z`);
      url.searchParams.set('ending_at', `${dateTo}T23:59:59Z`);
      url.searchParams.append('group_by[]', 'api_key_id');
      url.searchParams.append('group_by[]', 'model');
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.set('limit', '31');
      if (afterId) url.searchParams.set('after_id', afterId);

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) break;

      const data = await res.json() as {
        data?: Array<{
          starting_at?: string;
          results?: AnthropicUsageResult[];
        }>;
        has_more?: boolean;
        last_id?: string;
      };

      for (const bucket of data.data ?? []) {
        const date = bucket.starting_at?.slice(0, 10) ?? dateFrom;
        for (const result of bucket.results ?? []) {
          rows.push({ date, result });
        }
      }

      afterId = data.has_more ? data.last_id : undefined;
    } while (afterId);

    return rows;
  }

  private async fetchCostReport(
    apiKey: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<Map<string, number>> {
    const dateCostMap = new Map<string, number>();
    const headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    let afterId: string | undefined;

    do {
      const url = new URL('https://api.anthropic.com/v1/organizations/cost_report');
      url.searchParams.set('starting_at', `${dateFrom}T00:00:00Z`);
      url.searchParams.set('ending_at', `${dateTo}T23:59:59Z`);
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.set('limit', '31');
      if (afterId) url.searchParams.set('after_id', afterId);

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) break;

      const data = await res.json() as {
        data?: Array<{ starting_at?: string; cost?: string | number }>;
        has_more?: boolean;
        last_id?: string;
      };

      for (const bucket of data.data ?? []) {
        const date = bucket.starting_at?.slice(0, 10) ?? dateFrom;
        // Cost API returns USD cents as decimal strings — divide by 100
        const costUsd = Number(bucket.cost ?? 0) / 100;
        dateCostMap.set(date, (dateCostMap.get(date) ?? 0) + costUsd);
      }

      afterId = data.has_more ? data.last_id : undefined;
    } while (afterId);

    return dateCostMap;
  }

  private async estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cacheReadTokens: number,
    cacheCreationTokens: number,
  ): Promise<number> {
    const pricing = await getModelPricing('anthropic', model);
    if (!pricing) return 0;

    const standardCost = calculateCost(inputTokens, outputTokens, pricing);
    const cacheReadCost = calculateCostWithCache(cacheReadTokens, 0, pricing);
    // Cache creation is priced at 125% of standard input rate
    const cacheCreationRate = Number(pricing.input_per_mtok) * 1.25;
    const cacheCreationCost = (cacheCreationTokens / 1_000_000) * cacheCreationRate;

    return standardCost + cacheReadCost + cacheCreationCost;
  }

  private reconcileCosts(
    rows: IntermediateRow[],
    dateCostMap: Map<string, number>,
  ): Array<IntermediateRow & { reconciledCost: number; costSource: 'blended' | 'estimated' }> {
    const dateEstimateSum = new Map<string, number>();
    for (const row of rows) {
      dateEstimateSum.set(row.date, (dateEstimateSum.get(row.date) ?? 0) + row.estimatedCost);
    }

    return rows.map((row) => {
      const authoritativeTotal = dateCostMap.get(row.date);
      if (authoritativeTotal !== undefined && authoritativeTotal > 0) {
        const estimateSum = dateEstimateSum.get(row.date) ?? 1;
        const scale = estimateSum > 0 ? authoritativeTotal / estimateSum : 1;
        return { ...row, reconciledCost: row.estimatedCost * scale, costSource: 'blended' as const };
      }
      return { ...row, reconciledCost: row.estimatedCost, costSource: 'estimated' as const };
    });
  }

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const [usageData, dateCostMap] = await Promise.all([
        this.fetchUsageReport(apiKey, dateFrom, dateTo),
        this.fetchCostReport(apiKey, dateFrom, dateTo),
      ]);

      const intermediate: IntermediateRow[] = [];

      for (const { date, result } of usageData) {
        const inputTokens = result.uncached_input_tokens ?? 0;
        const outputTokens = result.output_tokens ?? 0;
        const cacheReadTokens = result.cache_read_input_tokens ?? 0;
        const cacheCreationTokens = result.cache_creation_input_tokens ?? 0;

        const estimatedCost = await this.estimateCost(
          result.model ?? 'unknown',
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
        );

        intermediate.push({ date, estimatedCost, result });
      }

      const reconciled = this.reconcileCosts(intermediate, dateCostMap);

      const rows: UsageRow[] = reconciled.map(({ date, reconciledCost, costSource, result }) => {
        const inputTokens = result.uncached_input_tokens ?? 0;
        const outputTokens = result.output_tokens ?? 0;
        const cacheReadTokens = result.cache_read_input_tokens ?? 0;
        const cacheCreationTokens = result.cache_creation_input_tokens ?? 0;
        const totalInput = inputTokens + cacheReadTokens;

        return {
          date,
          model: result.model ?? 'unknown',
          input_tokens: totalInput,
          output_tokens: outputTokens,
          total_tokens: totalInput + outputTokens,
          cost_usd: reconciledCost,
          request_count: 0,
          unit_type: 'tokens',
          unit_count: totalInput + outputTokens,
          cached_read_tokens: cacheReadTokens,
          cache_creation_tokens: cacheCreationTokens,
          input_audio_tokens: 0,
          output_audio_tokens: 0,
          cost_source: costSource,
          remote_key_id: result.api_key_id || undefined,
        };
      });

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching Anthropic usage',
      );
    }
  }

  async listManagedKeys(apiKey: string): Promise<ManagedKeyInfo[]> {
    const managedKeys: ManagedKeyInfo[] = [];
    const headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    let afterId: string | undefined;

    try {
      do {
        const url = new URL('https://api.anthropic.com/v1/organizations/api_keys');
        url.searchParams.set('limit', '100');
        url.searchParams.set('status', 'active');
        if (afterId) url.searchParams.set('after_id', afterId);

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) break;

        const data = await res.json() as {
          data?: Array<{
            id: string;
            name?: string;
            partial_key_hint?: string;
            workspace_id?: string;
          }>;
          has_more?: boolean;
          last_id?: string;
        };

        for (const key of data.data ?? []) {
          managedKeys.push({
            remote_key_id: key.id,
            name: key.name ?? null,
            redacted_value: key.partial_key_hint ?? null,
            project_id: key.workspace_id ?? null,
            project_name: null,
            last_used_at: null,
          });
        }

        afterId = data.has_more ? data.last_id : undefined;
      } while (afterId);
    } catch {
      // Return whatever was collected before the error
    }

    return managedKeys;
  }
}
