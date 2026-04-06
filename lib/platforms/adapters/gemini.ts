import { BaseAdapter } from './base';
import type { SyncResult, ProviderCapabilities } from '../types';

export class GeminiAdapter extends BaseAdapter {
  provider = 'gemini';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    // Google AI Studio has no usage/billing API — return success with empty rows
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );

      if (!res.ok) {
        const body = await res.text();
        return { valid: false, error: `Gemini returned ${res.status}: ${body}` };
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
      usageNote: 'Google AI Studio does not expose a usage or billing API. Key is validated and stored but usage sync is not available.',
    };
  }
}
