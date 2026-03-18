// ============================================
// Database Entity Types — Mirrors Supabase schema
// ============================================

// --- Profiles (replaces Companies) ---
export interface Profile {
  id: string; // matches auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  onboarded: boolean;
  role: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

// --- Projects ---
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- API Keys ---
export interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  nickname: string;
  encrypted_key: string;
  key_hint: string; // last 4 chars
  is_active: boolean;
  is_valid: boolean;
  last_validated: string | null;
  last_used: string | null;
  rotation_due: string | null;
  notes: string | null;
  endpoint_url: string | null;
  detected_pattern: number | null;
  consecutive_failures: number;
  last_failure_reason: string | null;
  has_usage_api: boolean;
  proxy_enabled: boolean;
  proxy_key_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Project Keys (join table) ---
export interface ProjectKey {
  id: string;
  project_id: string;
  key_id: string;
  assigned_at: string;
}

// --- Usage Records ---
export interface UsageRecord {
  id: string;
  key_id: string;
  user_id: string;
  date: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  unit_type: string;
  unit_count: number;
  cost_usd: number;
  request_count: number;
  source: string;
  proxy_request_id: string | null;
  project_feature: string | null;
  end_user_id: string | null;
  created_at: string;
}

// --- Budgets ---
export type BudgetScope = 'global' | 'platform' | 'project' | 'key';

export interface Budget {
  id: string;
  user_id: string;
  scope: BudgetScope;
  scope_id: string | null;
  platform: string | null;
  amount_usd: number;
  period: string;
  alert_50: boolean;
  alert_75: boolean;
  alert_90: boolean;
  alert_100: boolean;
  last_alerted_threshold: number | null;
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

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  scope: string | null;
  scope_id: string | null;
  scope_name: string | null;
  title: string;
  message: string;
  is_read: boolean;
  is_emailed: boolean;
  severity: AlertSeverity;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// --- Platforms (reference data) ---
export interface Platform {
  id: string;
  name: string;
  category: string;
  adapter_pattern: number;
  auth_type: string;
  base_url: string | null;
  pricing_url: string | null;
  key_page_url: string | null;
  docs_url: string | null;
  key_type_description: string;
  key_prefix: string | null;
  avg_monthly_usd_low: number | null;
  avg_monthly_usd_high: number | null;
  special_warning: string | null;
  openai_compatible: boolean;
  supports_chat: boolean;
  supports_embeddings: boolean;
  supports_images: boolean;
  supports_audio: boolean;
  supports_video: boolean;
  supports_fine_tuning: boolean;
  unit_type: string;
  color: string;
  is_active: boolean;
  requires_base_url: boolean;
  requires_project_id: boolean;
  requires_region: boolean;
  has_usage_api: boolean;
  sync_delay_minutes: number;
  proxy_path_prefix: string | null;
  proxy_supported: boolean;
  created_at: string;
}

// --- Price Snapshots ---
export interface PriceSnapshot {
  id: string;
  provider: string;
  model: string;
  model_display: string | null;
  input_per_mtok: number;
  output_per_mtok: number;
  unit_type: string;
  unit_display: string;
  batch_discount: number | null;
  supports_caching: boolean | null;
  captured_at: string;
}

// --- Saved Estimates ---
export interface SavedEstimate {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  provider: string;
  model: string;
  messages_per_day: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  num_users: number;
  use_batch: boolean;
  projected_monthly_usd: number | null;
  actual_monthly_usd: number | null;
  created_at: string;
}

// --- Reconciliation Logs ---
export interface ReconciliationLog {
  id: string;
  user_id: string;
  key_id: string;
  date: string;
  proxied_cost_usd: number;
  official_cost_usd: number;
  gap_usd: number | null;
  gap_percent: number | null;
  status: string;
  created_at: string;
}

// --- Subscriptions ---
export type PlanType = 'trial' | 'monthly' | 'annual';

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  plan: PlanType;
  billing_cycle: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
