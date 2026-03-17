import type { Provider } from '@/types';

// ==========================================
// Mock Data for Reports
// ==========================================

export interface MockReportRow {
  id: string;
  date: string;
  project_name: string;
  provider: Provider;
  model: string;
  tokens_prompt: number;
  tokens_completion: number;
  tokens_total: number;
  cost_usd: number;
}

export const mockReportData: MockReportRow[] = [
  {
    id: 'rep_01',
    date: '2026-03-17',
    project_name: 'Production Backend',
    provider: 'openai',
    model: 'gpt-4o',
    tokens_prompt: 1250000,
    tokens_completion: 450000,
    tokens_total: 1700000,
    cost_usd: 12.50,
  },
  {
    id: 'rep_02',
    date: '2026-03-17',
    project_name: 'Production Backend',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    tokens_prompt: 850000,
    tokens_completion: 320000,
    tokens_total: 1170000,
    cost_usd: 7.35,
  },
  {
    id: 'rep_03',
    date: '2026-03-16',
    project_name: 'Customer Support Bot',
    provider: 'anthropic',
    model: 'claude-3-haiku',
    tokens_prompt: 4500000,
    tokens_completion: 1200000,
    tokens_total: 5700000,
    cost_usd: 2.85,
  },
  {
    id: 'rep_04',
    date: '2026-03-16',
    project_name: 'R&D Experiments',
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    tokens_prompt: 15000000,
    tokens_completion: 2000000,
    tokens_total: 17000000,
    cost_usd: 1.70,
  },
  {
    id: 'rep_05',
    date: '2026-03-15',
    project_name: 'Production Backend',
    provider: 'openai',
    model: 'gpt-4o',
    tokens_prompt: 1400000,
    tokens_completion: 480000,
    tokens_total: 1880000,
    cost_usd: 13.80,
  },
  {
    id: 'rep_06',
    date: '2026-03-15',
    project_name: 'R&D Experiments',
    provider: 'mistral',
    model: 'codestral-latest',
    tokens_prompt: 2000000,
    tokens_completion: 500000,
    tokens_total: 2500000,
    cost_usd: 0.75,
  },
  {
    id: 'rep_07',
    date: '2026-03-14',
    project_name: 'Production Backend',
    provider: 'bedrock',
    model: 'anthropic.claude-3-sonnet',
    tokens_prompt: 900000,
    tokens_completion: 250000,
    tokens_total: 1150000,
    cost_usd: 6.50,
  },
  {
    id: 'rep_08',
    date: '2026-03-14',
    project_name: 'Legacy Migration',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    tokens_prompt: 5000000,
    tokens_completion: 1500000,
    tokens_total: 6500000,
    cost_usd: 4.75,
  },
];
