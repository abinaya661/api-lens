import { BaseAdapter } from './base';
import type { SyncResult, ProviderCapabilities } from '../types';

export class GrokAdapter extends BaseAdapter {
  provider = 'grok';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    // xAI has no public usage/billing API — return success with empty rows
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }> {
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text();
        return { valid: false, error: `xAI returned ${res.status}: ${body}` };
      }

      return { valid: true, keyType: 'standard' };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  override getCapabilities(): ProviderCapabilities {
    return {
      canValidateKey: true,
      canFetchUsage: false,
      canFetchCost: false,
      canListManagedKeys: false,
      canPerModelBreakdown: false,
      canPerKeyBreakdown: false,
      requiresAdminKey: false,
      usageNote: 'xAI does not yet offer a public usage or billing API. Key is validated and stored but usage sync is not available.',
    };
  }
}
