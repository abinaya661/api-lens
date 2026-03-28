// ============================================
// API Request/Response Types
// ============================================

import type {
  Alert,
  ApiKey,
  Budget,
  BudgetScope,
  ImagePricingTier,
  PriceSnapshot,
  Profile,
  Project,
  SavedEstimate,
  Subscription,
  UsageRecord,
} from './database';
import type { KeyHealth, Provider } from './providers';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export type ActionResult<T> = ApiResponse<T>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface SignUpRequest {
  email: string;
  password: string;
  company_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateKeyRequest {
  provider: Provider;
  label: string;
  credentials: Record<string, string>;
  project_id?: string;
}

export interface UpdateKeyRequest {
  label?: string;
  project_id?: string | null;
}

export interface KeyWithSpend extends ApiKey {
  current_month_spend: number;
  last_30_days_spend: number;
}

export interface ValidateKeyRequest {
  provider: Provider;
  credentials: Record<string, string>;
}

export interface ValidateKeyResponse {
  valid: boolean;
  error?: string;
  details?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface ProjectWithStats extends Project {
  total_spend: number;
  projected_spend: number;
  key_count: number;
  budget_progress: number | null;
}

export interface DailySpend {
  date: string;
  amount: number;
}

export interface PlatformSpend {
  provider: Provider | string;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  total_spend_this_month: number;
  projected_month_end: number;
  budget_remaining_usd?: number | null;
  budget_remaining_pct?: number | null;
  budget_remaining?: number | null;
  active_key_count: number;
  keys_by_health?: Record<KeyHealth, number>;
  daily_spend: DailySpend[];
  spend_by_platform: PlatformSpend[];
  top_keys: KeyWithSpend[];
  recent_alerts: Alert[];
  last_synced_at: string | null;
}

export interface CreateBudgetRequest {
  scope: BudgetScope;
  scope_id?: string;
  amount_usd: number;
  alert_thresholds?: number[];
}

export interface UpdateBudgetRequest {
  amount_usd?: number;
  alert_thresholds?: number[];
}

export interface BudgetWithProgress extends Budget {
  current_spend: number;
  percentage_used: number;
  scope_name: string;
}

export type UseCaseCategory =
  | 'text'
  | 'reasoning'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'embedding';

export interface ForecastDataPoint {
  date: string;
  actual: number;
  forecast: number | null;
}

export interface ProjectForecast {
  project_id: string;
  project_name: string;
  current_spend: number;
  forecast_month_end: number;
  confidence_low: number;
  confidence_high: number;
  daily_data: ForecastDataPoint[];
  by_provider: PlatformSpend[];
  by_model: { model: string; provider: string; spend: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CompanyForecast {
  current_spend: number;
  forecast_month_end: number;
  confidence_low: number;
  confidence_high: number;
  daily_data: ForecastDataPoint[];
  by_project: ProjectForecast[];
  unassigned_spend: number;
  by_provider: PlatformSpend[];
  budget_amount: number | null;
  budget_utilization_pct: number | null;
}

export interface EstimatorRequest {
  provider: Provider;
  model: string;
  messages_per_day: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  users: number;
}

export interface EstimatorResult {
  provider: Provider;
  model: string;
  daily_cost: number;
  monthly_cost: number;
  input_cost: number;
  output_cost: number;
}

export interface EstimatorComparison {
  input: EstimatorRequest;
  results: EstimatorResult[];
  cheapest: EstimatorResult;
  most_expensive: EstimatorResult;
  savings_suggestion: string | null;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  month: string;
  total_spend: number;
  previous_month_spend: number;
  change_percentage: number;
  biggest_platform: PlatformSpend;
  biggest_project: { name: string; spend: number } | null;
  biggest_key: { label: string; spend: number; provider: Provider } | null;
  share_token: string;
  created_at: string;
}

export interface CreateCustomCostRequest {
  key_id: string;
  amount_usd: number;
  week_start: string;
  notes?: string;
}

export type {
  Alert,
  ApiKey,
  Budget,
  ImagePricingTier,
  PriceSnapshot,
  Profile,
  Project,
  SavedEstimate,
  Subscription,
  UsageRecord,
};
