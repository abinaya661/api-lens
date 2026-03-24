import { createAdminClient } from '@/lib/supabase/admin';
import { decryptCredentials, type EncryptedPayload } from '@/lib/encryption';
import { getAdapter } from './registry';
import type { UsageRow } from './types';

interface SyncStats {
  keys_processed: number;
  keys_succeeded: number;
  keys_failed: number;
  rows_upserted: number;
  errors: string[];
}

export async function syncAllKeys(): Promise<SyncStats> {
  const supabase = createAdminClient();
  const stats: SyncStats = { keys_processed: 0, keys_succeeded: 0, keys_failed: 0, rows_upserted: 0, errors: [] };

  // Fetch all active keys
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, user_id, provider, encrypted_key, nickname, consecutive_failures')
    .eq('is_active', true);

  if (error || !keys) {
    stats.errors.push(error?.message ?? 'Failed to fetch keys');
    return stats;
  }

  for (const key of keys) {
    stats.keys_processed++;
    const adapter = getAdapter(key.provider);
    if (!adapter) {
      stats.errors.push(`No adapter for provider: ${key.provider} (key: ${key.nickname})`);
      stats.keys_failed++;
      continue;
    }

    try {
      // Decrypt the key
      const payload: EncryptedPayload = JSON.parse(key.encrypted_key);
      const plainKey = decryptCredentials(payload);

      // Fetch usage for last 2 days (to catch delayed data)
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const dateFrom = twoDaysAgo.toISOString().slice(0, 10);
      const dateTo = now.toISOString().slice(0, 10);

      const result = await adapter.fetchUsage(plainKey, dateFrom, dateTo);

      if (result.success && result.rows.length > 0) {
        // Upsert usage records
        const records = result.rows.map((row: UsageRow) => ({
          key_id: key.id,
          user_id: key.user_id,
          date: row.date,
          provider: key.provider,
          model: row.model,
          input_tokens: row.input_tokens,
          output_tokens: row.output_tokens,
          total_tokens: row.total_tokens,
          unit_type: row.unit_type,
          unit_count: row.unit_count,
          cost_usd: row.cost_usd,
          request_count: row.request_count,
          source: 'sync',
        }));

        const { error: upsertError } = await supabase
          .from('usage_records')
          .upsert(records, { onConflict: 'key_id,date,model' });

        if (upsertError) {
          stats.errors.push(`Upsert failed for ${key.nickname}: ${upsertError.message}`);
        } else {
          stats.rows_upserted += records.length;
        }
      }

      // Update key status
      if (result.success) {
        await supabase
          .from('api_keys')
          .update({
            last_used: new Date().toISOString(),
            is_valid: true,
            consecutive_failures: 0,
            last_failure_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', key.id);
      } else {
        const newFailures = Math.min((key.consecutive_failures ?? 0) + 1, 10);
        const shouldDeactivate = newFailures >= 5;
        await supabase
          .from('api_keys')
          .update({
            last_used: new Date().toISOString(),
            is_valid: false,
            consecutive_failures: newFailures,
            ...(shouldDeactivate ? { is_active: false } : {}),
            last_failure_reason: result.error ?? 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', key.id);
      }

      if (result.success) {
        stats.keys_succeeded++;
      } else {
        stats.keys_failed++;
      }
    } catch (e) {
      stats.keys_failed++;
      stats.errors.push(`${key.nickname}: ${e instanceof Error ? e.message : 'Unknown error'}`);

      const newFailures = Math.min((key.consecutive_failures ?? 0) + 1, 10);
      const shouldDeactivate = newFailures >= 5;
      await supabase
        .from('api_keys')
        .update({
          is_valid: false,
          consecutive_failures: newFailures,
          ...(shouldDeactivate ? { is_active: false } : {}),
          last_failure_reason: e instanceof Error ? e.message : 'Sync error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', key.id);
    }
  }

  return stats;
}

export async function checkBudgets(): Promise<{ alerts_created: number }> {
  const supabase = createAdminClient();
  let alertsCreated = 0;

  // Get all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*');

  if (!budgets) return { alerts_created: 0 };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  for (const budget of budgets) {
    // Calculate current spend for this budget's scope
    let query = supabase
      .from('usage_records')
      .select('cost_usd')
      .eq('user_id', budget.user_id)
      .gte('date', monthStart)
      .lte('date', today);

    if (budget.scope === 'platform' && budget.platform) {
      query = query.eq('provider', budget.platform);
    } else if (budget.scope === 'key' && budget.scope_id) {
      query = query.eq('key_id', budget.scope_id);
    }
    // 'global' scope = all records for user

    const { data: records } = await query;
    if (!records) continue;

    const totalSpend = records.reduce((sum, r) => sum + Number(r.cost_usd), 0);
    const pct = budget.amount_usd > 0 ? (totalSpend / budget.amount_usd) * 100 : 0;

    // Check thresholds (50, 75, 90, 100)
    const thresholds = [
      { pct: 50, enabled: budget.alert_50, severity: 'info' as const },
      { pct: 75, enabled: budget.alert_75, severity: 'warning' as const },
      { pct: 90, enabled: budget.alert_90, severity: 'warning' as const },
      { pct: 100, enabled: budget.alert_100, severity: 'critical' as const },
    ];

    const lastAlerted = budget.last_alerted_threshold ?? 0;

    for (const t of thresholds) {
      if (t.enabled && pct >= t.pct && lastAlerted < t.pct) {
        // Check if alert already exists to prevent race condition duplicates
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('user_id', budget.user_id)
          .eq('type', 'budget_threshold')
          .eq('title', `Budget ${t.pct}% reached`)
          .eq('scope', budget.scope)
          .maybeSingle();

        if (!existingAlert) {
          await supabase.from('alerts').insert({
            user_id: budget.user_id,
            type: 'budget_threshold',
            severity: t.severity,
            title: `Budget ${t.pct}% reached`,
            message: `Your ${budget.scope} budget of $${budget.amount_usd} is ${Math.round(pct)}% used ($${totalSpend.toFixed(2)} spent).`,
            scope: budget.scope,
            scope_id: budget.scope_id,
          });

          await supabase
            .from('budgets')
            .update({ last_alerted_threshold: t.pct })
            .eq('id', budget.id);

          alertsCreated++;
        }
      }
    }
  }

  return { alerts_created: alertsCreated };
}
