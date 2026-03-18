import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class VertexAIAdapter extends BaseAdapter {
  provider = 'vertex_ai';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(_apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // Vertex AI uses GCP service account credentials and OAuth tokens,
    // which cannot be easily validated with a simple fetch call.
    return {
      valid: true,
      error: 'Vertex AI key validation requires GCP OAuth. Key accepted without verification.',
    };
  }
}
