import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class FalAdapter extends BaseAdapter {
  provider = 'fal';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Fal.ai doesn't have a dedicated validation endpoint;
      // attempt a lightweight call to check the key
      const res = await fetch('https://queue.fal.run/fal-ai/fast-sdxl', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized API key' };
      }

      // Any other response (including 422, 429, 200) means the key is valid
      return { valid: true };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
