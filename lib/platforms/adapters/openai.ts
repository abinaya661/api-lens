import { BaseAdapter } from './base';
import type { SyncResult, UsageRow, ManagedKeyInfo, ProviderCapabilities } from '../types';
import { getModelPricing, calculateCost } from '@/lib/pricing';

interface UsageApiRow {
  model: string;
  api_key_id: string;
  input_tokens: number;
  output_tokens: number;
  cached_read_tokens: number;
  input_audio_tokens: number;
  output_audio_tokens: number;
  request_count: number;
  date: string;
}

export class OpenAIAdapter extends BaseAdapter {
  provider = 'openai';

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }> {
    if (!apiKey.startsWith('sk-admin-')) {
      return {
        valid: false,
        error: 'OpenAI requires an Admin API key (starts with sk-admin-...). Create one at platform.openai.com → Settings → API Keys. Only organization owners can create these.',
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    try {
      const costsRes = await fetch(
        `https://api.openai.com/v1/organization/costs?start_time=${oneDayAgo}&end_time=${now}&limit=1`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
      );
      if (costsRes.ok) return { valid: true, keyType: 'admin' };

      // If geo-restricted, the key itself is valid — Vercel's servers (US) will reach the API fine.
      // Accept the key so it can be added; sync will work correctly from Vercel.
      if (costsRes.status === 403) {
        const body = await costsRes.json().catch(() => ({})) as { error?: { code?: string } };
        if (body?.error?.code === 'unsupported_country_region_territory') {
          return { valid: true, keyType: 'admin' };
        }
      }

      const usageRes = await fetch(
        `https://api.openai.com/v1/organization/usage/completions?start_time=${oneDayAgo}&end_time=${now}&limit=1`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
      );
      if (usageRes.ok) return { valid: true, keyType: 'admin' };

      if (usageRes.status === 403) {
        const body = await usageRes.json().catch(() => ({})) as { error?: { code?: string } };
        if (body?.error?.code === 'unsupported_country_region_territory') {
          return { valid: true, keyType: 'admin' };
        }
      }

      const errBody = await usageRes.text();
      return { valid: false, error: `Admin API key validation failed. OpenAI returned ${usageRes.status}: ${errBody}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  private async fetchCostsApi(
    apiKey: string,
    startTime: number,
    endTime: number,
  ): Promise<Map<string, number>> {
    const costMap = new Map<string, number>();
    let nextPage: string | undefined;

    do {
      const url = new URL('https://api.openai.com/v1/organization/costs');
      url.searchParams.set('start_time', String(startTime));
      url.searchParams.set('end_time', String(endTime));
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.append('group_by[]', 'line_item');
      url.searchParams.set('limit', '100');
      if (nextPage) url.searchParams.set('page', nextPage);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) break;

      const data = await res.json() as {
        results?: Array<{ line_item?: string; amount?: { value?: number } }>;
        has_more?: boolean;
        next_page?: string;
      };

      for (const result of data.results ?? []) {
        const model = result.line_item ?? 'unknown';
        const cost = Number(result.amount?.value ?? 0);
        costMap.set(model, (costMap.get(model) ?? 0) + cost);
      }

      nextPage = data.has_more ? data.next_page : undefined;
    } while (nextPage);

    return costMap;
  }

  private async fetchUsageApi(
    apiKey: string,
    startTime: number,
    endTime: number,
  ): Promise<UsageApiRow[]> {
    const rows: UsageApiRow[] = [];
    let nextPage: string | undefined;

    do {
      const url = new URL('https://api.openai.com/v1/organization/usage/completions');
      url.searchParams.set('start_time', String(startTime));
      url.searchParams.set('end_time', String(endTime));
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.append('group_by[]', 'model');
      url.searchParams.append('group_by[]', 'api_key_id');
      url.searchParams.set('limit', '100');
      if (nextPage) url.searchParams.set('next_page', nextPage);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) break;

      const data = await res.json() as {
        data?: Array<{
          start_time?: number;
          results?: Array<{
            model?: string;
            api_key_id?: string;
            input_tokens?: number;
            output_tokens?: number;
            input_cached_tokens?: number;
            input_audio_tokens?: number;
            output_audio_tokens?: number;
            num_model_requests?: number;
          }>;
        }>;
        has_more?: boolean;
        next_page?: string;
      };

      for (const bucket of data.data ?? []) {
        const bucketDate = bucket.start_time
          ? new Date(bucket.start_time * 1000).toISOString().slice(0, 10)
          : new Date(startTime * 1000).toISOString().slice(0, 10);

        for (const result of bucket.results ?? []) {
          rows.push({
            model: result.model ?? 'unknown',
            api_key_id: result.api_key_id ?? '',
            input_tokens: result.input_tokens ?? 0,
            output_tokens: result.output_tokens ?? 0,
            cached_read_tokens: result.input_cached_tokens ?? 0,
            input_audio_tokens: result.input_audio_tokens ?? 0,
            output_audio_tokens: result.output_audio_tokens ?? 0,
            request_count: result.num_model_requests ?? 0,
            date: bucketDate,
          });
        }
      }

      nextPage = data.has_more ? data.next_page : undefined;
    } while (nextPage);

    return rows;
  }

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const startTime = Math.floor(new Date(dateFrom).getTime() / 1000);
      const endTime = Math.floor(new Date(dateTo + 'T23:59:59Z').getTime() / 1000);

      const [costMap, usageRows] = await Promise.all([
        this.fetchCostsApi(apiKey, startTime, endTime),
        this.fetchUsageApi(apiKey, startTime, endTime),
      ]);

      // Build model-level total token counts for cost proration
      const modelTotalTokens = new Map<string, number>();
      for (const row of usageRows) {
        const total = row.input_tokens + row.cached_read_tokens + row.input_audio_tokens
          + row.output_tokens + row.output_audio_tokens;
        modelTotalTokens.set(row.model, (modelTotalTokens.get(row.model) ?? 0) + total);
      }

      const rows: UsageRow[] = [];

      for (const row of usageRows) {
        const modelCost = costMap.get(row.model);
        let costUsd: number;

        if (modelCost !== undefined && modelCost > 0) {
          const modelTokens = modelTotalTokens.get(row.model) ?? 1;
          const keyTokens = row.input_tokens + row.cached_read_tokens + row.input_audio_tokens
            + row.output_tokens + row.output_audio_tokens;
          costUsd = modelCost * (keyTokens / modelTokens);
        } else {
          const pricing = await getModelPricing('openai', row.model);
          costUsd = pricing ? calculateCost(row.input_tokens, row.output_tokens, pricing) : 0;
        }

        rows.push({
          date: row.date,
          model: row.model,
          input_tokens: row.input_tokens,
          output_tokens: row.output_tokens,
          total_tokens: row.input_tokens + row.output_tokens,
          cost_usd: costUsd,
          request_count: row.request_count,
          unit_type: 'tokens',
          unit_count: row.input_tokens + row.output_tokens,
          cached_read_tokens: row.cached_read_tokens,
          cache_creation_tokens: 0,
          input_audio_tokens: row.input_audio_tokens,
          output_audio_tokens: row.output_audio_tokens,
          cost_source: 'estimated',
          remote_key_id: row.api_key_id || undefined,
        });
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

  async listManagedKeys(apiKey: string): Promise<ManagedKeyInfo[]> {
    const managedKeys: ManagedKeyInfo[] = [];

    try {
      const projectsRes = await fetch(
        'https://api.openai.com/v1/organization/projects?limit=100',
        { headers: { 'Authorization': `Bearer ${apiKey}` } },
      );
      if (!projectsRes.ok) return managedKeys;

      const projectsData = await projectsRes.json() as {
        data?: Array<{ id: string; name: string }>;
      };

      for (const project of projectsData.data ?? []) {
        let nextPage: string | undefined;

        do {
          const url = new URL(`https://api.openai.com/v1/organization/projects/${project.id}/api_keys`);
          url.searchParams.set('limit', '100');
          if (nextPage) url.searchParams.set('after', nextPage);

          const keysRes = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${apiKey}` },
          });
          if (!keysRes.ok) break;

          const keysData = await keysRes.json() as {
            data?: Array<{ id: string; name?: string; redacted_value?: string; last_used_at?: string }>;
            has_more?: boolean;
            next_page?: string;
          };

          for (const key of keysData.data ?? []) {
            managedKeys.push({
              remote_key_id: key.id,
              name: key.name ?? null,
              redacted_value: key.redacted_value ?? null,
              project_id: project.id,
              project_name: project.name,
              last_used_at: key.last_used_at ?? null,
            });
          }

          nextPage = keysData.has_more ? keysData.next_page : undefined;
        } while (nextPage);
      }
    } catch {
      // Return whatever was collected before the error
    }

    return managedKeys;
  }

  override getCapabilities(): ProviderCapabilities {
    return {
      canValidateKey: true,
      canFetchUsage: true,
      canFetchCost: true,
      canListManagedKeys: true,
      canPerModelBreakdown: true,
      canPerKeyBreakdown: true,
      requiresAdminKey: true,
      adminKeyPrefix: 'sk-admin-',
      keyPlaceholder: 'sk-admin-...',
    };
  }
}
