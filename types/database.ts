// ============================================
// Database Entity Types
// Mirrors the current Supabase schema while keeping a small
// compatibility surface for older call sites that still expect
// pre-migration field names.
// ============================================

import { Provider } from './providers';

export interface NotificationPrefs {
  budget_alerts_email?: boolean;
  key_validation_failure_email?: boolean;
  trial_ending_reminder_email?: boolean;
  weekly_spending_report_email?: boolean;
  key_rotation_reminder_email?: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  onboarded: boolean;
  timezone: string;
  currency: string;
  notification_prefs?: NotificationPrefs | null;
  avatar_url?: string | null;
  role?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface EncryptedCredentials {
  ciphertext: string;
  iv: string;
  tag: string;
  dek: string;
}

export interface ApiKey {
  id: string;
  company_id?: string;
  project_id?: string | null;
  provider: Provider;
  nickname: string;
  encrypted_credentials?: EncryptedCredentials;
  key_hint: string;
  is_active: boolean;
  last_synced_at: string | null;
  consecutive_failures: number;
  last_error: string | null;
  endpoint_url: string | null;
  notes: string | null;
  rotation_due: string | null;
  last_validated: string | null;
  last_failure_reason: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
  encrypted_key?: string;
  is_valid?: boolean;
  last_used?: string | null;
  detected_pattern?: number | null;
  has_usage_api?: boolean;
  proxy_enabled?: boolean;
  proxy_key_id?: string | null;
  key_type?: string;  // 'standard' | 'admin'
}

export interface UsageRecord {
  id: string;
  key_id: string;
  provider: string;
  model: string;
  date: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  request_count: number;
  synced_at: string;
  user_id?: string;
  total_tokens?: number;
  unit_type?: string;
  unit_count?: number;
  source?: string;
  proxy_request_id?: string | null;
  project_feature?: string | null;
  end_user_id?: string | null;
  created_at?: string;
  recorded_at?: string;
  cached_read_tokens?: number;
  cache_creation_tokens?: number;
  input_audio_tokens?: number;
  output_audio_tokens?: number;
  cost_source?: string;
  remote_key_id?: string | null;
}

export interface ManagedKey {
  id: string;
  parent_key_id: string;
  company_id: string;
  provider: string;
  remote_key_id: string;
  remote_key_name: string | null;
  redacted_value: string | null;
  remote_project_id: string | null;
  remote_project_name: string | null;
  last_used_at: string | null;
  first_seen_at: string;
  is_tracked: boolean;
  created_at: string;
  updated_at: string;
}

export type BudgetScope = 'global' | 'platform' | 'project' | 'key';

export interface Budget {
  id: string;
  company_id: string;
  scope: BudgetScope;
  scope_id: string | null;
  platform: string | null;
  amount_usd: number;
  period: string;
  alert_50: boolean;
  alert_75: boolean;
  alert_90: boolean;
  alert_100: boolean;
  last_alerted_threshold?: number | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export type AlertType =
  | 'budget_threshold'
  | 'spend_spike'
  | 'key_inactive'
  | 'key_rotation_due'
  | 'custom_cost_reminder';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  company_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  related_key_id: string | null;
  related_project_id: string | null;
  related_budget_id: string | null;
  is_read: boolean;
  is_emailed?: boolean;
  created_at: string;
  user_id?: string;
  scope?: string | null;
  scope_id?: string | null;
  scope_name?: string | null;
  metadata?: Record<string, unknown> | null;
}

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

export interface ImagePricingTier {
  quality: string;
  resolution: string;
  price: number;
}

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
  category: string;
  capability_score: number;
  is_deprecated: boolean;
  context_window: number | null;
  supports_batch: boolean;
  batch_input_per_mtok: number | null;
  batch_output_per_mtok: number | null;
  cached_input_per_mtok: number | null;
  image_prices: ImagePricingTier[] | null;
  per_unit_price: number | null;
}

export interface SavedEstimate {
  id: string;
  company_id?: string | null;
  project_id: string | null;
  name?: string;
  provider: string;
  model: string;
  messages_per_day: number;
  avg_input_tokens?: number;
  avg_output_tokens?: number;
  tokens_per_message?: number;
  users?: number;
  num_users?: number;
  use_batch?: boolean;
  projected_monthly_usd?: number | null;
  actual_monthly_usd?: number | null;
  estimated_monthly_cost_usd?: number | null;
  created_at: string;
  user_id?: string;
}

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

export type PlanType = 'monthly' | 'annual';
export type SubscriptionStatus =
  | 'trial'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'grace_period'
  | 'frozen'
  | 'cancelled';

export interface Subscription {
  id: string;
  company_id: string;
  status: SubscriptionStatus;
  plan: PlanType | null;
  trial_ends_at: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  dodo_subscription_id: string | null;
  dodo_customer_id: string | null;
  period_end: string | null;
  last_payment_at: string | null;
  grace_period_ends_at: string | null;
  payment_method_collected?: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}
