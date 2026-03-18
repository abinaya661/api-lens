import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class AssemblyAIAdapter extends BaseAdapter {
  provider = 'assemblyai';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', {
        headers: { 'Authorization': apiKey },
      });

      if (res.ok) {
        return { valid: true };
      }

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized API key' };
      }

      // Other statuses (e.g. 200 with empty list) still mean the key is valid
      return { valid: true };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
