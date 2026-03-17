import type { Provider } from '@/types';

// ==========================================
// Mock Data for Projects & API Keys
// ==========================================

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  key_count: number;
  total_spend: number;
  status: 'active' | 'archived';
}

export interface MockApiKey {
  id: string;
  project_id: string;
  project_name: string;
  provider: Provider;
  label: string;
  key_hint: string; // last 4 chars visible
  status: 'active' | 'revoked' | 'expired';
  health: 'healthy' | 'warning' | 'error';
  last_synced_at: string | null;
  total_spend: number;
  tokens_used: number;
  created_at: string;
  expires_at: string | null;
}

export const mockProjects: MockProject[] = [
  {
    id: 'proj_01',
    name: 'Production Backend',
    slug: 'production-backend',
    description: 'Main production AI services — chatbot, summarization, and embeddings.',
    created_at: '2026-01-15T10:00:00Z',
    key_count: 4,
    total_spend: 847.32,
    status: 'active',
  },
  {
    id: 'proj_02',
    name: 'R&D Experiments',
    slug: 'rd-experiments',
    description: 'Research and development queries across multiple providers.',
    created_at: '2026-02-01T14:30:00Z',
    key_count: 3,
    total_spend: 234.56,
    status: 'active',
  },
  {
    id: 'proj_03',
    name: 'Customer Support Bot',
    slug: 'customer-support-bot',
    description: 'Automated customer support responses using Claude and GPT models.',
    created_at: '2026-02-20T09:15:00Z',
    key_count: 2,
    total_spend: 156.78,
    status: 'active',
  },
  {
    id: 'proj_04',
    name: 'Legacy Migration',
    slug: 'legacy-migration',
    description: 'One-time content migration using AI-assisted tools.',
    created_at: '2025-11-10T16:00:00Z',
    key_count: 1,
    total_spend: 45.90,
    status: 'archived',
  },
];

export const mockApiKeys: MockApiKey[] = [
  {
    id: 'key_01',
    project_id: 'proj_01',
    project_name: 'Production Backend',
    provider: 'openai',
    label: 'GPT-4o Production',
    key_hint: '•••• a4Kx',
    status: 'active',
    health: 'healthy',
    last_synced_at: '2026-03-17T20:30:00Z',
    total_spend: 423.17,
    tokens_used: 28_240_000,
    created_at: '2026-01-15T10:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_02',
    project_id: 'proj_01',
    project_name: 'Production Backend',
    provider: 'anthropic',
    label: 'Claude 3.5 Sonnet Prod',
    key_hint: '•••• m9Qz',
    status: 'active',
    health: 'healthy',
    last_synced_at: '2026-03-17T20:30:00Z',
    total_spend: 312.45,
    tokens_used: 20_830_000,
    created_at: '2026-01-15T10:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_03',
    project_id: 'proj_01',
    project_name: 'Production Backend',
    provider: 'gemini',
    label: 'Gemini 2.0 Flash',
    key_hint: '•••• rT7p',
    status: 'active',
    health: 'healthy',
    last_synced_at: '2026-03-17T19:45:00Z',
    total_spend: 67.20,
    tokens_used: 672_000_000,
    created_at: '2026-02-01T14:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_04',
    project_id: 'proj_02',
    project_name: 'R&D Experiments',
    provider: 'openai',
    label: 'GPT-4 R&D Key',
    key_hint: '•••• bN3w',
    status: 'active',
    health: 'warning',
    last_synced_at: '2026-03-17T18:00:00Z',
    total_spend: 134.56,
    tokens_used: 4_485_000,
    created_at: '2026-02-01T14:30:00Z',
    expires_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'key_05',
    project_id: 'proj_02',
    project_name: 'R&D Experiments',
    provider: 'mistral',
    label: 'Codestral Dev',
    key_hint: '•••• kL2j',
    status: 'active',
    health: 'healthy',
    last_synced_at: '2026-03-17T20:15:00Z',
    total_spend: 45.00,
    tokens_used: 15_000_000,
    created_at: '2026-02-15T11:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_06',
    project_id: 'proj_03',
    project_name: 'Customer Support Bot',
    provider: 'anthropic',
    label: 'Claude 3 Haiku Support',
    key_hint: '•••• zR8m',
    status: 'active',
    health: 'healthy',
    last_synced_at: '2026-03-17T20:00:00Z',
    total_spend: 78.90,
    tokens_used: 63_120_000,
    created_at: '2026-02-20T09:15:00Z',
    expires_at: null,
  },
  {
    id: 'key_07',
    project_id: 'proj_04',
    project_name: 'Legacy Migration',
    provider: 'openai',
    label: 'GPT-3.5 Migration',
    key_hint: '•••• fW1v',
    status: 'revoked',
    health: 'error',
    last_synced_at: '2026-01-05T12:00:00Z',
    total_spend: 45.90,
    tokens_used: 30_600_000,
    created_at: '2025-11-10T16:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_08',
    project_id: 'proj_01',
    project_name: 'Production Backend',
    provider: 'bedrock',
    label: 'Bedrock Claude Prod',
    key_hint: '•••• pJ5n',
    status: 'active',
    health: 'warning',
    last_synced_at: '2026-03-16T23:00:00Z',
    total_spend: 44.50,
    tokens_used: 29_600_000,
    created_at: '2026-03-01T08:00:00Z',
    expires_at: null,
  },
];
