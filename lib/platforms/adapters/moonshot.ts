import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class MoonshotAdapter extends BaseAdapter {
  provider = 'moonshot';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    // Moonshot (Kimi) does not expose a public usage/billing API
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Moonshot is OpenAI-compatible; validate by listing models
      const res = await fetch('https://api.moonshot.cn/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized API key' };
      }

      const body = await res.text();
      return { valid: false, error: `Moonshot returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
