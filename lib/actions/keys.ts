'use server';

import { createClient } from '@/lib/supabase/server';
import { addKeySchema, updateKeySchema, type AddKeyInput, type UpdateKeyInput } from '@/lib/validations/key';
import { decryptCredentials, encryptCredentials, extractKeyHint, type EncryptedPayload } from '@/lib/encryption';
import { logAudit } from '@/lib/utils/audit';
import { checkRateLimit, apiRateLimit } from '@/lib/ratelimit';
import { getAdapter } from '@/lib/platforms/registry';
import type { ApiKey } from '@/types/database';

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

export async function listKeys(): Promise<ActionResult<ApiKey[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getKey(id: string): Promise<ActionResult<ApiKey>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addKey(input: AddKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = addKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // Redis rate limit: 10 key creations per minute per user
    const rl = await checkRateLimit(apiRateLimit, `add_key:${user.id}`);
    if (!rl.success) {
      return { data: null, error: 'Too many requests. Please wait a minute.' };
    }

    const { api_key, provider, nickname, project_id, endpoint_url, notes } = parsed.data;

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

    // Encrypt the API key
    const encrypted = encryptCredentials(api_key);
    const keyHint = extractKeyHint(api_key);
    const validatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        nickname,
        encrypted_key: JSON.stringify(encrypted),
        key_hint: keyHint,
        is_valid: true,
        has_usage_api: true,
        last_validated: validatedAt,
        last_failure_reason: null,
        consecutive_failures: 0,
        endpoint_url: endpoint_url || null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // If project_id provided, create project_keys link
    if (project_id && data) {
      const { error: projectKeyError } = await supabase.from('project_keys').insert({
        project_id,
        key_id: data.id,
      });

      if (projectKeyError) {
        await supabase.from('api_keys').delete().eq('id', data.id).eq('user_id', user.id);
        return { data: null, error: projectKeyError.message };
      }
    }

    await logAudit(supabase, {
      userId: user.id,
      action: 'key.created',
      entityType: 'api_key',
      entityId: data?.id,
      metadata: { provider, nickname },
    });

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateKey(input: UpdateKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = updateKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { id, ...updates } = parsed.data;

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit(supabase, {
      userId: user.id,
      action: 'key.updated',
      entityType: 'api_key',
      entityId: id,
      metadata: updates,
    });

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function refreshKeyStatus(id: string): Promise<ActionResult<ApiKey>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data: key, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (keyError || !key) {
      return { data: null, error: keyError?.message ?? 'Key not found' };
    }

    const validatedAt = new Date().toISOString();
    const adapter = getAdapter(key.provider);

    if (!adapter) {
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          is_valid: false,
          is_active: false,
          has_usage_api: false,
          last_validated: validatedAt,
          last_failure_reason: 'This provider is not supported for API key tracking yet.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    }

    const encryptedPayload: EncryptedPayload = JSON.parse(key.encrypted_key);
    const plainKey = decryptCredentials(encryptedPayload);
    const validation = await adapter.validateKey(plainKey);

    if (!validation.valid) {
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          is_valid: false,
          is_active: false,
          has_usage_api: false,
          last_validated: validatedAt,
          last_failure_reason: validation.error ?? 'The provider rejected this key during manual refresh.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      await logAudit(supabase, {
        userId: user.id,
        action: 'key.updated',
        entityType: 'api_key',
        entityId: id,
        metadata: {
          refresh: true,
          result: 'inactive',
          reason: validation.error ?? 'validation_failed',
        },
      });

      return { data, error: null };
    }

    const { dateFrom, dateTo } = getValidationWindow();
    const syncCheck = await adapter.fetchUsage(plainKey, dateFrom, dateTo);

    if (!syncCheck.success) {
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          is_valid: false,
          is_active: false,
          has_usage_api: false,
          last_validated: validatedAt,
          last_failure_reason: syncCheck.error ?? 'The provider usage check failed during manual refresh.',
          consecutive_failures: Math.min((key.consecutive_failures ?? 0) + 1, 10),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      await logAudit(supabase, {
        userId: user.id,
        action: 'key.updated',
        entityType: 'api_key',
        entityId: id,
        metadata: {
          refresh: true,
          result: 'inactive',
          reason: syncCheck.error ?? 'usage_check_failed',
        },
      });

      return { data, error: null };
    }

    const shouldReactivate = !key.is_active && !!key.last_failure_reason;
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        is_valid: true,
        is_active: key.is_active || shouldReactivate,
        has_usage_api: true,
        last_validated: validatedAt,
        last_failure_reason: null,
        consecutive_failures: 0,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit(supabase, {
      userId: user.id,
      action: 'key.updated',
      entityType: 'api_key',
      entityId: id,
      metadata: {
        refresh: true,
        result: 'healthy',
      },
    });

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteKey(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // Verify the key belongs to this user before deleting project links
    const { data: keyCheck } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!keyCheck) return { data: null, error: 'Key not found' };

    // Now safe to delete project_keys
    await supabase.from('project_keys').delete().eq('key_id', id);

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { data: null, error: error.message };

    await logAudit(supabase, {
      userId: user.id,
      action: 'key.deleted',
      entityType: 'api_key',
      entityId: id,
    });

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
