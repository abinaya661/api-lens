import type { Provider } from '@/types';

// ==========================================
// Mock Data for Budgets & Alerts
// ==========================================

export type BudgetScope = 'global' | 'platform' | 'project' | 'key';
export type BudgetPeriod = 'daily' | 'monthly';
export type AlertType = 'budget_80' | 'budget_100' | 'spend_spike' | 'key_health' | 'key_rotation' | 'waste';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface MockBudget {
  id: string;
  scope: BudgetScope;
  scope_label: string;
  provider?: Provider;
  limit_usd: number;
  spent_usd: number;
  period: BudgetPeriod;
  threshold_pct: number; // alert at this %
  created_at: string;
}

export interface MockAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
  scope_label?: string;
}

export const mockBudgets: MockBudget[] = [
  {
    id: 'bud_01',
    scope: 'global',
    scope_label: 'All Providers',
    limit_usd: 2000,
    spent_usd: 1284.18,
    period: 'monthly',
    threshold_pct: 80,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bud_02',
    scope: 'platform',
    scope_label: 'OpenAI',
    provider: 'openai',
    limit_usd: 1000,
    spent_usd: 557.73,
    period: 'monthly',
    threshold_pct: 80,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bud_03',
    scope: 'platform',
    scope_label: 'Anthropic',
    provider: 'anthropic',
    limit_usd: 600,
    spent_usd: 391.35,
    period: 'monthly',
    threshold_pct: 80,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bud_04',
    scope: 'project',
    scope_label: 'Production Backend',
    limit_usd: 1500,
    spent_usd: 847.32,
    period: 'monthly',
    threshold_pct: 80,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'bud_05',
    scope: 'key',
    scope_label: 'GPT-4o Production',
    limit_usd: 50,
    spent_usd: 42.30,
    period: 'daily',
    threshold_pct: 80,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'bud_06',
    scope: 'project',
    scope_label: 'R&D Experiments',
    limit_usd: 500,
    spent_usd: 234.56,
    period: 'monthly',
    threshold_pct: 90,
    created_at: '2026-02-01T00:00:00Z',
  },
];

export const mockAlerts: MockAlert[] = [
  {
    id: 'alert_01',
    type: 'budget_80',
    severity: 'warning',
    title: 'Budget threshold reached — GPT-4o Production',
    message: 'Daily spend for GPT-4o Production has reached 84.6% ($42.30 / $50.00). Consider scaling back or increasing the limit.',
    acknowledged: false,
    created_at: '2026-03-17T19:45:00Z',
    scope_label: 'GPT-4o Production',
  },
  {
    id: 'alert_02',
    type: 'spend_spike',
    severity: 'critical',
    title: 'Spend spike detected — Anthropic',
    message: 'Anthropic spend increased 340% over the last hour compared to the 7-day average. This may indicate a runaway process.',
    acknowledged: false,
    created_at: '2026-03-17T18:30:00Z',
    scope_label: 'Anthropic',
  },
  {
    id: 'alert_03',
    type: 'key_health',
    severity: 'warning',
    title: 'Key health degraded — Bedrock Claude Prod',
    message: 'The Bedrock Claude Prod key has not synced successfully in the last 24 hours. Last sync: 2026-03-16 23:00 UTC.',
    acknowledged: false,
    created_at: '2026-03-17T12:00:00Z',
    scope_label: 'Bedrock Claude Prod',
  },
  {
    id: 'alert_04',
    type: 'key_rotation',
    severity: 'info',
    title: 'Key rotation recommended — GPT-4 R&D Key',
    message: 'The GPT-4 R&D Key is expiring in 15 days (April 1, 2026). Please rotate the key before expiration to avoid service interruption.',
    acknowledged: true,
    created_at: '2026-03-15T09:00:00Z',
    scope_label: 'GPT-4 R&D Key',
  },
  {
    id: 'alert_05',
    type: 'budget_100',
    severity: 'critical',
    title: 'Budget exceeded — R&D Experiments',
    message: 'Monthly budget for R&D Experiments exceeded 100% ($510.20 / $500.00). All keys within this project have been flagged.',
    acknowledged: true,
    created_at: '2026-03-10T06:00:00Z',
    scope_label: 'R&D Experiments',
  },
  {
    id: 'alert_06',
    type: 'waste',
    severity: 'info',
    title: 'Potential waste detected — GPT-3.5 Migration',
    message: 'Key "GPT-3.5 Migration" has been revoked but was still active for 45 days with zero usage. Consider cleaning up unused resources.',
    acknowledged: true,
    created_at: '2026-03-05T14:00:00Z',
    scope_label: 'Legacy Migration',
  },
];
