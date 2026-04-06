import { createAdminClient } from '@/lib/supabase/admin';
import { decryptCredentials, type EncryptedPayload } from '@/lib/encryption';
import { sendEmail, getAlertEmailHtml } from '@/lib/email/resend';
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
    .select('id, company_id, provider, encrypted_credentials, encrypted_key, nickname, consecutive_failures, usage_capability')
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

    // Skip keys that are validation-only — no usage data to fetch
    if (key.usage_capability === 'validation_only') {
      await supabase.from('api_keys').update({
        last_synced_at: new Date().toISOString(),
        consecutive_failures: 0,
        last_failure_reason: null,
        updated_at: new Date().toISOString(),
      }).eq('id', key.id);
      stats.keys_succeeded++;
      continue;
    }

    try {
      // Support both the current JSONB payload and legacy stringified payloads.
      const payload = key.encrypted_credentials
        ? (key.encrypted_credentials as unknown as EncryptedPayload)
        : key.encrypted_key
          ? (JSON.parse(key.encrypted_key) as EncryptedPayload)
          : null;

      if (!payload) {
        throw new Error('Missing encrypted credentials payload');
      }

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
          date: row.date,
          provider: key.provider,
          model: row.model,
          input_tokens: row.input_tokens,
          output_tokens: row.output_tokens,
          cost_usd: row.cost_usd,
          request_count: row.request_count,
          cached_read_tokens: row.cached_read_tokens ?? 0,
          cache_creation_tokens: row.cache_creation_tokens ?? 0,
          input_audio_tokens: row.input_audio_tokens ?? 0,
          output_audio_tokens: row.output_audio_tokens ?? 0,
          cost_source: row.cost_source ?? 'api',
          remote_key_id: row.remote_key_id ?? null,
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
            last_synced_at: new Date().toISOString(),
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
            last_synced_at: new Date().toISOString(),
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

export async function syncManagedKeys(): Promise<{ keys_discovered: number }> {
  const supabase = createAdminClient();
  let keysDiscovered = 0;

  const { data: adminKeys } = await supabase
    .from('api_keys')
    .select('id, company_id, provider, encrypted_credentials, encrypted_key, key_type')
    .eq('is_active', true)
    .eq('key_type', 'admin');

  if (!adminKeys) return { keys_discovered: 0 };

  for (const key of adminKeys) {
    const adapter = getAdapter(key.provider);
    if (!adapter?.listManagedKeys) continue;

    const payload = key.encrypted_credentials
      ? (key.encrypted_credentials as unknown as EncryptedPayload)
      : key.encrypted_key
        ? (JSON.parse(key.encrypted_key) as EncryptedPayload)
        : null;
    if (!payload) continue;

    const plainKey = decryptCredentials(payload);

    try {
      const managedKeys = await adapter.listManagedKeys(plainKey);

      for (const mk of managedKeys) {
        const { error } = await supabase
          .from('managed_keys')
          .upsert({
            parent_key_id: key.id,
            company_id: key.company_id,
            provider: key.provider,
            remote_key_id: mk.remote_key_id,
            remote_key_name: mk.name,
            redacted_value: mk.redacted_value,
            remote_project_id: mk.project_id,
            remote_project_name: mk.project_name,
            last_used_at: mk.last_used_at,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'parent_key_id,remote_key_id' });

        if (!error) keysDiscovered++;
      }
    } catch {
      // Continue with next key on error
    }
  }

  return { keys_discovered: keysDiscovered };
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
    // usage_records has no company_id — must filter by key_ids belonging to this company
    const { data: companyKeys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('company_id', budget.company_id);

    const companyKeyIds = companyKeys?.map((k: { id: string }) => k.id) ?? [];
    if (companyKeyIds.length === 0) continue;

    let totalSpend = 0;

    if (budget.scope === 'project' && budget.scope_id) {
      // Sum usage for all keys assigned directly to this project
      const { data: projectKeys } = await supabase
        .from('api_keys')
        .select('id')
        .eq('company_id', budget.company_id)
        .eq('project_id', budget.scope_id);

      if (projectKeys && projectKeys.length > 0) {
        const keyIds = projectKeys.map((pk: { id: string }) => pk.id);
        const { data: records } = await supabase
          .from('usage_records')
          .select('cost_usd')
          .in('key_id', keyIds)
          .gte('date', monthStart)
          .lte('date', today);
        if (records) {
          totalSpend = records.reduce((sum, r) => sum + Number(r.cost_usd), 0);
        }
      }
    } else {
      // global, platform, or key scope — filter by company key_ids with optional narrowing
      let query = supabase
        .from('usage_records')
        .select('cost_usd')
        .in('key_id', companyKeyIds)
        .gte('date', monthStart)
        .lte('date', today);

      if (budget.scope === 'platform' && budget.platform) {
        query = query.eq('provider', budget.platform);
      } else if (budget.scope === 'key' && budget.scope_id) {
        query = query.eq('key_id', budget.scope_id);
      }
      // 'global' scope = all records for company

      const { data: records } = await query;
      if (records) {
        totalSpend = records.reduce((sum, r) => sum + Number(r.cost_usd), 0);
      }
    }

    const pct = budget.amount_usd > 0 ? (totalSpend / budget.amount_usd) * 100 : 0;

    // Check thresholds 50 / 90 / 100 only — alert_75 is treated as unused
    const thresholds = [
      { pct: 50,  enabled: budget.alert_50,  severity: 'info'     as const },
      { pct: 90,  enabled: budget.alert_90,  severity: 'warning'  as const },
      { pct: 100, enabled: budget.alert_100, severity: 'critical' as const },
    ];

    const lastAlerted = budget.last_alerted_threshold ?? 0;

    for (const t of thresholds) {
      if (!t.enabled || pct < t.pct || lastAlerted >= t.pct) continue;

      // Prevent race-condition duplicates
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('company_id', budget.company_id)
        .eq('type', 'budget_threshold')
        .eq('title', `Budget ${t.pct}% reached`)
        .eq('related_budget_id', budget.id)
        .maybeSingle();

      if (existingAlert) continue;

      // Build a human-readable scope label for the email
      let scopeLabel = 'global';
      if (budget.scope === 'platform') {
        scopeLabel = budget.platform ?? 'platform';
      } else if (budget.scope === 'project') {
        const { data: proj } = await supabase
          .from('projects')
          .select('name')
          .eq('id', budget.scope_id)
          .maybeSingle();
        scopeLabel = proj?.name ? `project "${proj.name}"` : 'project';
      } else if (budget.scope === 'key') {
        const { data: keyRow } = await supabase
          .from('api_keys')
          .select('nickname')
          .eq('id', budget.scope_id)
          .maybeSingle();
        scopeLabel = keyRow?.nickname ? `key "${keyRow.nickname}"` : 'key';
      }

      const alertTitle = `Budget ${t.pct}% reached`;
      const alertMessage =
        `Your ${scopeLabel} budget of $${Number(budget.amount_usd).toFixed(2)} is ` +
        `${Math.round(pct)}% used ($${totalSpend.toFixed(2)} spent).`;

      await supabase.from('alerts').insert({
        company_id: budget.company_id,
        type: 'budget_threshold',
        severity: t.severity,
        title: alertTitle,
        message: alertMessage,
        related_budget_id: budget.id,
      });

      await supabase
        .from('budgets')
        .update({ last_alerted_threshold: t.pct })
        .eq('id', budget.id);

      // Send email alert to the company owner
      const { data: company } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('id', budget.company_id)
        .single();

      if (company?.owner_id) {
        const { data: uData } = await supabase.auth.admin.getUserById(company.owner_id);
        const userEmail = uData.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: `Budget Alert: ${t.pct}% of your ${scopeLabel} budget used`,
            html: getAlertEmailHtml({
              title: alertTitle,
              message: alertMessage,
              severity: t.severity,
            }),
          });
        }
      }

      alertsCreated++;
    }
  }

  return { alerts_created: alertsCreated };
}
