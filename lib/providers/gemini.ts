import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

export async function validateGemini(serviceAccountJson: string, projectId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(serviceAccountJson);
    if (!parsed.private_key || !parsed.client_email) {
      return { valid: false, error: 'Invalid Service Account JSON format' };
    }
    // Deep validation requires Google Auth Client, returning true based on format
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid JSON string' };
  }
}

export async function fetchGeminiUsage(
  serviceAccountJson: string,
  projectId: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  // Requires Google Cloud Billing API which is complex without the google-auth-library SDK.
  return { success: true, usage: [], error: 'GCP Billing integration requires Google Auth SDK.' };
}
