import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class AzureOpenAIAdapter extends BaseAdapter {
  provider = 'azure_openai';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(
      this.provider,
      [],
      'Azure OpenAI usage tracking requires Azure Monitor or Cost Management access beyond a plain API key.',
    );
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const separatorIndex = apiKey.indexOf('|');
      if (separatorIndex === -1) {
        return {
          valid: false,
          error: 'Azure OpenAI key must be in format "endpoint|api-key" (for example https://your-resource.openai.azure.com|your-key)',
        };
      }

      const endpoint = apiKey.slice(0, separatorIndex).replace(/\/+$/, '');
      const key = apiKey.slice(separatorIndex + 1);

      const url = `${endpoint}/openai/deployments?api-version=2024-02-01`;
      const res = await fetch(url, {
        headers: { 'api-key': key },
      });

      if (!res.ok) {
        const body = await res.text();
        return { valid: false, error: `Azure OpenAI returned ${res.status}: ${body}` };
      }

      return {
        valid: false,
        error: 'This Azure OpenAI key is valid for inference, but API Lens cannot track Azure usage/billing with only an endpoint and API key. Azure Monitor or Cost Management integration is required.',
      };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
