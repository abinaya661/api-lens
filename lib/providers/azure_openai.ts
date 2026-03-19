import type { Provider, NormalizedUsage, ProviderSyncResult } from '@/types';

export async function validateAzureOpenAI(apiKey: string, endpoint: string, subscriptionId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = new URL(endpoint);
    url.pathname = '/openai/models';
    url.searchParams.set('api-version', '2023-05-15');
    
    const res = await fetch(url.toString(), {
      headers: { 'api-key': apiKey },
    });
    
    if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid Azure API key or permissions' };
    if (!res.ok) return { valid: false, error: `Azure OpenAI returned status ${res.status}` };
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function fetchAzureOpenAIUsage(
  apiKey: string,
  endpoint: string,
  subscriptionId: string,
  keyId: string,
  since?: Date,
): Promise<ProviderSyncResult> {
  // Requires Azure Cost Management API and Azure AD token exchange which is complex without the SDK.
  // Returning empty usage for now as a stub.
  return { success: true, usage: [], error: 'Azure Cost Management API integration requires SDK.' };
}
