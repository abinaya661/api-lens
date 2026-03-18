import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class AzureOpenAIAdapter extends BaseAdapter {
  provider = 'azure_openai';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // apiKey format expected: "endpoint|key" (e.g. "https://myresource.openai.azure.com|abc123")
      const separatorIndex = apiKey.indexOf('|');
      if (separatorIndex === -1) {
        return {
          valid: false,
          error: 'Azure OpenAI key must be in format "endpoint|api-key" (e.g. https://myresource.openai.azure.com|your-key)',
        };
      }

      const endpoint = apiKey.slice(0, separatorIndex).replace(/\/+$/, '');
      const key = apiKey.slice(separatorIndex + 1);

      const url = `${endpoint}/openai/deployments?api-version=2024-02-01`;
      const res = await fetch(url, {
        headers: { 'api-key': key },
      });

      if (res.ok) {
        return { valid: true };
      }

      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or unauthorized API key' };
      }

      const body = await res.text();
      return { valid: false, error: `Azure OpenAI returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
