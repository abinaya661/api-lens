import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class DeepSeekAdapter extends BaseAdapter {
  provider = 'deepseek';

  async fetchUsage(apiKey: string, dateFrom: string, _dateTo: string): Promise<SyncResult> {
    try {
      // DeepSeek exposes a balance endpoint for billing info
      const res = await fetch('https://api.deepseek.com/user/balance', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return this.makeSyncResult(this.provider, [], `DeepSeek API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const rows: UsageRow[] = [];

      // DeepSeek returns balance info; we track the total usage from balance_infos
      if (data.balance_infos && Array.isArray(data.balance_infos)) {
        for (const info of data.balance_infos) {
          const totalBalance = Number(info.total_balance ?? 0);
          const grantedBalance = Number(info.granted_balance ?? 0);
          const toppedUpBalance = Number(info.topped_up_balance ?? 0);
          const used = (grantedBalance + toppedUpBalance) - totalBalance;

          rows.push({
            date: dateFrom,
            model: info.currency ?? 'all-models',
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: Math.max(0, used),
            request_count: 0,
            unit_type: 'tokens',
            unit_count: 0,
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching DeepSeek usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Validate by checking balance (billing access)
      const res = await fetch('https://api.deepseek.com/user/balance', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        return { valid: true };
      }

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized API key' };
      }

      // Fall back to models endpoint
      const modelsRes = await fetch('https://api.deepseek.com/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (modelsRes.ok) {
        return { valid: true };
      }

      const body = await modelsRes.text();
      return { valid: false, error: `DeepSeek returned ${modelsRes.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
