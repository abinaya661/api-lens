export interface UsageRow {
  date: string;          // YYYY-MM-DD
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_count: number;
  unit_type: string;     // 'tokens' | 'characters' | 'seconds' | 'images'
  unit_count: number;
}

export interface SyncResult {
  success: boolean;
  rows: UsageRow[];
  error?: string;
  provider: string;
  synced_at: string;
}

export interface PlatformAdapter {
  provider: string;
  fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult>;
  validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;
}
