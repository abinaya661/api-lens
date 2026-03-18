import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class ReplicateAdapter extends BaseAdapter {
  provider = 'replicate';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      const url = `https://api.replicate.com/v1/predictions?created_after=${dateFrom}T00:00:00Z`;
      const rows: UsageRow[] = [];
      let nextUrl: string | null = url;

      while (nextUrl) {
        const res: Response = await fetch(nextUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!res.ok) {
          const body = await res.text();
          return this.makeSyncResult(this.provider, [], `Replicate API error ${res.status}: ${body}`);
        }

        const data = await res.json();
        const predictions = data.results ?? [];

        for (const pred of predictions) {
          const createdAt = pred.created_at ?? '';
          const predDate = createdAt.slice(0, 10);

          // Stop if we've gone past dateTo
          if (predDate > dateTo) {
            nextUrl = null;
            break;
          }

          const costUsd =
            pred.metrics?.predict_time != null
              ? 0 // Cost is not directly in the API; we track time
              : 0;

          rows.push({
            date: predDate || dateFrom,
            model: pred.model ?? pred.version ?? 'unknown',
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: costUsd,
            request_count: 1,
            unit_type: 'seconds',
            unit_count: pred.metrics?.predict_time ?? 0,
          });
        }

        // Paginate if available, but limit to avoid runaway loops
        nextUrl = data.next ?? null;
        if (rows.length > 10000) {
          break;
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching Replicate usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.replicate.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `Replicate returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
