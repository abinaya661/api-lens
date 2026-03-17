// ============================================
// Database Entity Types — Mirrors Supabase schema
// ============================================

import type { Provider, KeyHealth } from './providers';

// --- Companies ---
export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// --- Projects ---
export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// --- API Keys ---
export interface ApiKey {
  id: string;
  company_id: string;
  project_id: string | null;
  provider: Provider;
  label: string;
  encrypted_credentials: string;
  key_hint: string; // last 4 chars, e.g., "4f8b"
  health: KeyHealth;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// --- Usage Records ---
export interface UsageRecord {
  id: string;
  key_id: string;
  provider: Provider;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  recorded_at: string;
  synced_at: string;
}

// --- Budgets ---
export type BudgetScope = 'global' | 'platform' | 'project' | 'key';

export interface Budget {
  id: string;
  company_id: string;
  scope: BudgetScope;
  scope_id: string | null; // null for global, platform name, project_id, or key_id
  amount_usd: number;
  period: 'monthly';
  alert_thresholds: number[]; // e.g., [50, 75, 90, 100]
  created_at: string;
  updated_at: string;
}

// --- Alerts ---
export type AlertType =
  | 'budget_threshold'
  | 'spend_spike'
  | 'key_inactive'
  | 'key_rotation_due'
  | 'custom_cost_reminder';

export interface Alert {
  id: string;
  company_id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  related_key_id: string | null;
  related_project_id: string | null;
  related_budget_id: string | null;
  is_read: boolean;
  created_at: string;
}

// --- Notifications ---
export type NotificationChannel = 'in_app' | 'email';

export interface Notification {
  id: string;
  alert_id: string;
  channel: NotificationChannel;
  recipient: string;
  sent_at: string | null;
  delivered: boolean;
  error: string | null;
}

// --- Cost Estimates ---
export interface CostEstimate {
  id: string;
  company_id: string | null; // null if anonymous
  project_id: string | null;
  provider: Provider;
  model: string;
  messages_per_day: number;
  tokens_per_message: number;
  users: number;
  estimated_monthly_cost_usd: number;
  created_at: string;
}

// --- Model Pricing ---
export interface ModelPricing {
  id: string;
  provider: Provider;
  model_id: string;
  model_name: string;
  input_price_per_1k: number;
  output_price_per_1k: number;
  effective_date: string;
  is_current: boolean;
}

// --- Audit Log ---
export type AuditAction =
  | 'key_created'
  | 'key_updated'
  | 'key_deleted'
  | 'key_rotated'
  | 'key_assigned'
  | 'key_unassigned'
  | 'key_validated';

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// --- Custom Cost Entries ---
export interface CustomCostEntry {
  id: string;
  key_id: string;
  company_id: string;
  project_id: string | null;
  amount_usd: number;
  week_start: string;
  notes: string | null;
  created_at: string;
}

// --- Subscriptions ---
export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'frozen' | 'cancelled';
export type PlanType = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  company_id: string;
  razorpay_subscription_id: string | null;
  status: SubscriptionStatus;
  plan: PlanType;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_ends_at: string | null;
  created_at: string;
  updated_at: string;
}
