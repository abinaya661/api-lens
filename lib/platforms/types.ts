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
  // Extended fields added in migration 011 (optional — other adapters untouched)
  cached_read_tokens?: number;
  cache_creation_tokens?: number;
  input_audio_tokens?: number;
  output_audio_tokens?: number;
  cost_source?: 'api' | 'estimated' | 'blended';
  remote_key_id?: string;
}

export interface SyncResult {
  success: boolean;
  rows: UsageRow[];
  error?: string;
  provider: string;
  synced_at: string;
}

export interface ManagedKeyInfo {
  remote_key_id: string;
  name: string | null;
  redacted_value: string | null;
  project_id: string | null;
  project_name: string | null;
  last_used_at: string | null;
}

export interface PlatformAdapter {
  provider: string;
  fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult>;
  validateKey(apiKey: string): Promise<{ valid: boolean; error?: string; keyType?: string }>;
  listManagedKeys?(apiKey: string): Promise<ManagedKeyInfo[]>;
}
