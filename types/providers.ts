// ============================================
// Provider Types — Shared across all agents
// ============================================

export const PROVIDERS = [
  'openai',
  'anthropic',
  'gemini',
  'grok',
  'elevenlabs',
  'openrouter',
] as const;

export type Provider = (typeof PROVIDERS)[number];

export interface ProviderConfig {
  id: Provider;
  name: string;
  icon: string;
  authMethod: 'api_key' | 'service_account' | 'iam' | 'azure_ad' | 'none';
  syncDelay: string;
  fields: ProviderField[];
}

export interface ProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'url';
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export interface NormalizedUsage {
  key_id: string;
  provider: Provider;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  recorded_at: string; // ISO 8601 UTC
  synced_at: string;   // ISO 8601 UTC
}

export interface ProviderSyncResult {
  success: boolean;
  usage: NormalizedUsage[];
  error?: string;
  raw_data?: unknown;
}

export type KeyHealth = 'active' | 'invalid' | 'sync_error' | 'inactive';

export const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'Admin API Key',
        type: 'password',
        placeholder: 'sk-admin-...',
        required: true,
        helpText: 'Admin API key required (sk-admin-...). Go to platform.openai.com → Settings → API Keys. Only org owners can create these.',
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🟠',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'Admin API Key',
        type: 'password',
        placeholder: 'sk-ant-admin-...',
        required: true,
        helpText: 'Admin API key required (sk-ant-admin...). Go to console.anthropic.com → Settings → API Keys. Only org admins can create these.',
      },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🔵',
    authMethod: 'api_key',
    syncDelay: '~15 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'AIza...',
        required: true,
        helpText: 'Standard API key. Validates your key but usage tracking is not available (Google AI Studio has no billing API).',
      },
    ],
  },
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    icon: '⚡',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'xai-...',
        required: true,
        helpText: 'Standard API key. Validates your key but usage tracking is not yet available (xAI has no public billing API).',
      },
    ],
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    icon: '🔊',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-elevenlabs-key',
        required: true,
        helpText: 'Go to elevenlabs.io → Profile → API Keys',
      },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🟣',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-or-...',
        required: true,
        helpText: 'Standard API key. Full usage tracking with per-model cost and token breakdown.',
      },
    ],
  },
};
