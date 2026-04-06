'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addKeySchema, updateKeySchema, type AddKeyInput, type UpdateKeyInput } from '@/lib/validations/key';
import { decryptCredentials, encryptCredentials, extractKeyHint, type EncryptedPayload } from '@/lib/encryption';
import { logAudit } from '@/lib/utils/audit';
import { checkRateLimit, apiRateLimit, dailySyncRateLimit } from '@/lib/ratelimit';
import { getAdapter } from '@/lib/platforms/registry';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import type { ApiKey, ManagedKey } from '@/types/database';
import type { UsageRow } from '@/lib/platforms/types';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

function getValidationWindow() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    dateFrom: yesterday.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

async function ensureProjectBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  projectId?: string | null,
) {
  if (!projectId) {
    return { error: null };
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error || !project) {
    return { error: 'Project not found' };
  }

  return { error: null };
}

export async function listKeys(): Promise<ActionResult<ApiKey[]>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    // Read with user client — RLS ensures users only see their own keys
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('company_id', auth.companyId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as ApiKey[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getKey(id: string): Promise<ActionResult<ApiKey>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ApiKey, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addKey(input: AddKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = addKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    // User client — verify identity and ownership only
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    const rl = await checkRateLimit(apiRateLimit, `add_key:${auth.userId}`);
    if (!rl.success) {
      return { data: null, error: 'Too many requests. Please wait a minute.' };
    }

    const { api_key, provider, nickname, project_id, endpoint_url, notes } = parsed.data;
    const projectCheck = await ensureProjectBelongsToCompany(supabase, auth.companyId, project_id ?? null);
    if (projectCheck.error) {
      return { data: null, error: projectCheck.error };
    }

    const adapter = getAdapter(provider);
    if (!adapter) {
      return { data: null, error: 'This provider is not supported for API key tracking yet.' };
    }

    const validation = await adapter.validateKey(api_key);
    if (!validation.valid) {
      return {
        data: null,
        error: validation.error ?? 'API key verification failed. We could not verify usage/billing access for this provider.',
      };
    }

    const keyType = validation.keyType ?? 'standard';
    const capabilities = adapter.getCapabilities();
    const usageCapability = capabilities.canPerModelBreakdown ? 'full'
      : capabilities.canFetchUsage ? 'aggregate'
      : 'validation_only';
    const encrypted = encryptCredentials(api_key);
    const keyHint = extractKeyHint(api_key);
    const validatedAt = new Date().toISOString();

    // Admin client — bypasses RLS for the write; ownership is already verified above
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        company_id: auth.companyId,
        user_id: auth.userId,
        project_id: project_id ?? null,
        provider,
        nickname,
        encrypted_credentials: encrypted,
        encrypted_key: JSON.stringify(encrypted),
        key_hint: keyHint,
        is_active: true,
        last_validated: validatedAt,
        last_failure_reason: null,
        consecutive_failures: 0,
        endpoint_url: endpoint_url || null,
        notes: notes ?? null,
        key_type: keyType,
        usage_capability: usageCapability,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit(supabaseAdmin, {
      userId: auth.userId,
      action: 'key.created',
      entityType: 'api_key',
      entityId: data?.id,
      metadata: { provider, nickname, project_id: project_id ?? null },
    });

    return { data: data as ApiKey, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateKey(input: UpdateKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = updateKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    // User client — verify identity and ownership only
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    const { id, ...updates } = parsed.data;
    const projectCheck = await ensureProjectBelongsToCompany(supabase, auth.companyId, updates.project_id);
    if (projectCheck.error) {
      return { data: null, error: projectCheck.error };
    }

    // Admin client — write (company_id filter ensures ownership)
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: 'Key not found' };
      return { data: null, error: error.message };
    }

    await logAudit(supabaseAdmin, {
      userId: auth.userId,
      action: 'key.updated',
      entityType: 'api_key',
      entityId: id,
      metadata: updates,
    });

    return { data: data as ApiKey, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function refreshKeyStatus(id: string): Promise<ActionResult<ApiKey>> {
  try {
    // User client — verify identity and read the key
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    // Daily rate limit: 3 manual syncs per day per user
    const rl = await checkRateLimit(dailySyncRateLimit, `daily_sync:${auth.userId}`);
    if (!rl.success) {
      return { data: null, error: 'Daily sync limit reached (3 per day). Try again tomorrow.' };
    }

    const { data: key, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single();

    if (keyError || !key) {
      return { data: null, error: keyError?.message ?? 'Key not found' };
    }

    const validatedAt = new Date().toISOString();
    const adapter = getAdapter(key.provider);

    // Admin client — all writes from here on
    const supabaseAdmin = createAdminClient();

    if (!adapter) {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .update({
          is_active: false,
          last_validated: validatedAt,
          last_failure_reason: 'This provider is not supported for API key tracking yet.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('company_id', auth.companyId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as ApiKey, error: null };
    }

    const encryptedPayload = key.encrypted_credentials
      ? (key.encrypted_credentials as unknown as EncryptedPayload)
      : JSON.parse(key.encrypted_key ?? '{}') as EncryptedPayload;
    const plainKey = decryptCredentials(encryptedPayload);
    const validation = await adapter.validateKey(plainKey);

    if (!validation.valid) {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .update({
          is_active: false,
          last_validated: validatedAt,
          last_failure_reason: validation.error ?? 'The provider rejected this key during manual refresh.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('company_id', auth.companyId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      await logAudit(supabaseAdmin, {
        userId: auth.userId,
        action: 'key.updated',
        entityType: 'api_key',
        entityId: id,
        metadata: { refresh: true, result: 'inactive', reason: validation.error ?? 'validation_failed' },
      });

      return { data: data as ApiKey, error: null };
    }

    const { dateFrom, dateTo } = getValidationWindow();
    const syncCheck = await adapter.fetchUsage(plainKey, dateFrom, dateTo);

    if (!syncCheck.success) {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .update({
          is_active: false,
          last_validated: validatedAt,
          last_failure_reason: syncCheck.error ?? 'The provider usage check failed during manual refresh.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('company_id', auth.companyId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      await logAudit(supabaseAdmin, {
        userId: auth.userId,
        action: 'key.updated',
        entityType: 'api_key',
        entityId: id,
        metadata: { refresh: true, result: 'inactive', reason: syncCheck.error ?? 'usage_check_failed' },
      });

      return { data: data as ApiKey, error: null };
    }

    // Upsert usage records from the sync check
    if (syncCheck.rows.length > 0) {
      const records = syncCheck.rows.map((row: UsageRow) => ({
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

      await supabaseAdmin
        .from('usage_records')
        .upsert(records, { onConflict: 'key_id,date,model' });
    }

    const shouldReactivate = !key.is_active && !!key.last_failure_reason;
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .update({
        is_active: key.is_active || shouldReactivate,
        last_validated: validatedAt,
        last_synced_at: validatedAt,
        last_failure_reason: null,
        consecutive_failures: 0,
        key_type: validation.keyType ?? key.key_type ?? 'standard',
      })
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit(supabaseAdmin, {
      userId: auth.userId,
      action: 'key.synced',
      entityType: 'api_key',
      entityId: id,
      metadata: { refresh: true, result: 'healthy', rows_synced: syncCheck.rows.length },
    });

    return { data: data as ApiKey, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteKey(id: string): Promise<ActionResult<null>> {
  try {
    // User client — verify identity and ownership
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    const { data: keyCheck } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single();

    if (!keyCheck) return { data: null, error: 'Key not found' };

    // Admin client — write
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('company_id', auth.companyId);

    if (error) return { data: null, error: error.message };

    await logAudit(supabaseAdmin, {
      userId: auth.userId,
      action: 'key.deleted',
      entityType: 'api_key',
      entityId: id,
    });

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function listManagedKeys(parentKeyId: string): Promise<ActionResult<ManagedKey[]>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('managed_keys')
      .select('*')
      .eq('parent_key_id', parentKeyId)
      .eq('company_id', auth.companyId)
      .order('remote_project_name', { ascending: true, nullsFirst: false })
      .order('remote_key_name', { ascending: true, nullsFirst: false });

    if (error) return { data: null, error: error.message };
    return { data: data as ManagedKey[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateManagedKeyTracking(
  id: string,
  isTracked: boolean,
): Promise<ActionResult<ManagedKey>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    // Verify ownership via user client
    const { data: mk } = await supabase
      .from('managed_keys')
      .select('id')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single();

    if (!mk) return { data: null, error: 'Managed key not found' };

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('managed_keys')
      .update({ is_tracked: isTracked, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit(supabaseAdmin, {
      userId: auth.userId,
      action: 'managed_key.updated',
      entityType: 'managed_key',
      entityId: id,
      metadata: { is_tracked: isTracked },
    });

    return { data: data as ManagedKey, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
