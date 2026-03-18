import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class GeminiAdapter extends BaseAdapter {
  provider = 'gemini';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `Gemini returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
