// ============================================
// Provider Types — Shared across all agents
// ============================================

export const PROVIDERS = [
  'openai',
  'anthropic',
  'gemini',
  'bedrock',
  'mistral',
  'cohere',
  'azure_openai',
  'openrouter',
  'elevenlabs',
  'deepgram',
  'assemblyai',
  'replicate',
  'fal',
  'vertex_ai',
  'custom',
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
        helpText: 'Go to platform.openai.com → Settings → API Keys → Create admin key',
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
        helpText: 'Go to console.anthropic.com → Settings → API Keys',
      },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🔵',
    authMethod: 'service_account',
    syncDelay: '~15 min',
    fields: [
      {
        key: 'service_account_json',
        label: 'Service Account JSON',
        type: 'textarea',
        placeholder: '{"type": "service_account", ...}',
        required: true,
        helpText: 'GCP Console → IAM → Service Accounts → Create Key (JSON)',
      },
      {
        key: 'project_id',
        label: 'GCP Project ID',
        type: 'text',
        placeholder: 'my-gcp-project',
        required: true,
      },
    ],
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    icon: '🟡',
    authMethod: 'iam',
    syncDelay: '~24 hr',
    fields: [
      {
        key: 'aws_access_key_id',
        label: 'AWS Access Key ID',
        type: 'password',
        placeholder: 'AKIA...',
        required: true,
      },
      {
        key: 'aws_secret_access_key',
        label: 'AWS Secret Access Key',
        type: 'password',
        placeholder: 'your-secret-key',
        required: true,
      },
      {
        key: 'aws_region',
        label: 'AWS Region',
        type: 'text',
        placeholder: 'us-east-1',
        required: true,
      },
    ],
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🟣',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-mistral-key',
        required: true,
        helpText: 'Go to console.mistral.ai → API Keys',
      },
    ],
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    icon: '🔴',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-cohere-key',
        required: true,
        helpText: 'Go to dashboard.cohere.com → API Keys',
      },
    ],
  },
  azure_openai: {
    id: 'azure_openai',
    name: 'Azure OpenAI',
    icon: '🔷',
    authMethod: 'azure_ad',
    syncDelay: '~12 hr',
    fields: [
      {
        key: 'api_key',
        label: 'Azure API Key',
        type: 'password',
        placeholder: 'your-azure-key',
        required: true,
      },
      {
        key: 'endpoint',
        label: 'Azure Endpoint URL',
        type: 'url',
        placeholder: 'https://your-resource.openai.azure.com',
        required: true,
      },
      {
        key: 'subscription_id',
        label: 'Azure Subscription ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
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
        helpText: 'Go to openrouter.ai → Keys',
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
  deepgram: {
    id: 'deepgram',
    name: 'Deepgram',
    icon: '🎙️',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-deepgram-key',
        required: true,
        helpText: 'Go to console.deepgram.com → API Keys',
      },
    ],
  },
  assemblyai: {
    id: 'assemblyai',
    name: 'AssemblyAI',
    icon: '📝',
    authMethod: 'api_key',
    syncDelay: 'Manual',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-assemblyai-key',
        required: true,
        helpText: 'Go to assemblyai.com → Dashboard → API Key',
      },
    ],
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    icon: '🔄',
    authMethod: 'api_key',
    syncDelay: '~5 min',
    fields: [
      {
        key: 'api_key',
        label: 'API Token',
        type: 'password',
        placeholder: 'r8_...',
        required: true,
        helpText: 'Go to replicate.com → Account → API Tokens',
      },
    ],
  },
  fal: {
    id: 'fal',
    name: 'Fal.ai',
    icon: '⚡',
    authMethod: 'api_key',
    syncDelay: 'Manual',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-fal-key',
        required: true,
        helpText: 'Go to fal.ai → Dashboard → Keys',
      },
    ],
  },
  vertex_ai: {
    id: 'vertex_ai',
    name: 'Vertex AI',
    icon: '🔷',
    authMethod: 'service_account',
    syncDelay: '~15 min',
    fields: [
      {
        key: 'service_account_json',
        label: 'Service Account JSON',
        type: 'textarea',
        placeholder: '{"type": "service_account", ...}',
        required: true,
        helpText: 'GCP Console → IAM → Service Accounts → Create Key (JSON)',
      },
      {
        key: 'project_id',
        label: 'GCP Project ID',
        type: 'text',
        placeholder: 'my-gcp-project',
        required: true,
      },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Platform',
    icon: '⚙️',
    authMethod: 'none',
    syncDelay: 'Manual',
    fields: [
      {
        key: 'platform_name',
        label: 'Platform Name',
        type: 'text',
        placeholder: 'e.g., Internal LLM Service',
        required: true,
      },
    ],
  },
};
