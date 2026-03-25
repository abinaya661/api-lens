import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class MoonshotAdapter extends BaseAdapter {
  provider = 'moonshot';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(
      this.provider,
      [],
      'Moonshot does not expose a public usage/billing API that API Lens can sync with an API key today.',
    );
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.moonshot.cn/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text();
        return { valid: false, error: `Moonshot returned ${res.status}: ${body}` };
      }

      return {
        valid: false,
        error: 'This Moonshot key is valid for inference, but API Lens cannot verify usage/billing tracking because Moonshot does not expose a public usage API for this credential.',
      };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
