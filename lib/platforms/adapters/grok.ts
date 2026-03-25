import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class GrokAdapter extends BaseAdapter {
  provider = 'grok';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(
      this.provider,
      [],
      'xAI usage tracking requires the Management API, not a standard inference API key.',
    );
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text();
        return { valid: false, error: `xAI returned ${res.status}: ${body}` };
      }

      return {
        valid: false,
        error: 'This xAI key is valid for inference, but API Lens needs an xAI Management API key plus team-level billing access to track usage.',
      };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
