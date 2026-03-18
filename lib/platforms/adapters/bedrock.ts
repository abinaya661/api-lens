import { BaseAdapter } from './base';
import type { SyncResult } from '../types';

export class BedrockAdapter extends BaseAdapter {
  provider = 'bedrock';

  async fetchUsage(_apiKey: string, _dateFrom: string, _dateTo: string): Promise<SyncResult> {
    return this.makeSyncResult(this.provider, []);
  }

  async validateKey(_apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // AWS Bedrock requires AWS SDK with SigV4 signing, which cannot be done
    // with a simple fetch call. We accept the key at face value.
    return {
      valid: true,
      error: 'Bedrock key validation requires AWS SDK. Key accepted without verification.',
    };
  }
}
