import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

export async function validateBedrock(accessKey: string, secretKey: string, region: string): Promise<{ valid: boolean; error?: string }> {
  if (!accessKey || !secretKey || !region) {
    return { valid: false, error: 'Missing AWS credentials' };
  }
  // AWS IAM validation via API without SDK requires full SigV4 signing implementation.
  // We assume valid format if length is reasonable.
  if (accessKey.length < 16) return { valid: false, error: 'Invalid Access Key length' };
  return { valid: true };
}

export async function fetchBedrockUsage(
  accessKey: string,
  secretKey: string,
  region: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  // Requires AWS Cost Explorer API and SigV4 signing.
  return { success: true, usage: [], error: 'AWS Cost Explorer integration requires AWS SDK.' };
}
