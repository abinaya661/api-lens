import type { PlatformAdapter, ProviderCapabilities, SyncResult, UsageRow } from '../types';

export abstract class BaseAdapter implements PlatformAdapter {
  abstract provider: string;
  abstract fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult>;

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Default validation: try a small API call
      const result = await this.fetchUsage(
        apiKey,
        new Date().toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10),
      );
      return { valid: result.success };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canValidateKey: true,
      canFetchUsage: false,
      canFetchCost: false,
      canListManagedKeys: false,
      canPerModelBreakdown: false,
      canPerKeyBreakdown: false,
      requiresAdminKey: false,
    };
  }

  protected makeSyncResult(provider: string, rows: UsageRow[], error?: string): SyncResult {
    return {
      success: !error,
      rows,
      error,
      provider,
      synced_at: new Date().toISOString(),
    };
  }
}
