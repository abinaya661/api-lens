import type { Provider } from '@/types';

// Simplified pricing DB for the Estimator
export interface EstimatorModel {
  id: string;
  provider: Provider;
  name: string;
  prompt_cost_per_m: number;
  completion_cost_per_m: number;
  context_window: string;
}

export const estimatorModels: EstimatorModel[] = [
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', prompt_cost_per_m: 5.00, completion_cost_per_m: 15.00, context_window: '128k' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', prompt_cost_per_m: 0.15, completion_cost_per_m: 0.60, context_window: '128k' },
  { id: 'claude-3-5-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', prompt_cost_per_m: 3.00, completion_cost_per_m: 15.00, context_window: '200k' },
  { id: 'claude-3-haiku', provider: 'anthropic', name: 'Claude 3 Haiku', prompt_cost_per_m: 0.25, completion_cost_per_m: 1.25, context_window: '200k' },
  { id: 'gemini-1-5-pro', provider: 'gemini', name: 'Gemini 1.5 Pro', prompt_cost_per_m: 3.50, completion_cost_per_m: 10.50, context_window: '2M' },
  { id: 'gemini-1-5-flash', provider: 'gemini', name: 'Gemini 1.5 Flash', prompt_cost_per_m: 0.35, completion_cost_per_m: 1.05, context_window: '1M' },
  { id: 'mistral-large', provider: 'mistral', name: 'Mistral Large 2', prompt_cost_per_m: 2.00, completion_cost_per_m: 6.00, context_window: '128k' },
];
