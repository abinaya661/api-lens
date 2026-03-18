'use server';

import { createClient } from '@/lib/supabase/server';
import { addKeySchema, updateKeySchema, type AddKeyInput, type UpdateKeyInput } from '@/lib/validations/key';
import { encryptCredentials } from '@/lib/encryption';
import type { ApiKey } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
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

    const { api_key, provider, nickname, project_id, endpoint_url, notes } = parsed.data;

    // Encrypt the API key
    const encrypted = encryptCredentials(api_key);
    const keyHint = api_key.slice(-4);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        nickname,
        encrypted_key: encrypted,
        key_hint: keyHint,
        endpoint_url: endpoint_url || null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // If project_id provided, create project_keys link
    if (project_id && data) {
      await supabase.from('project_keys').insert({
        project_id,
        key_id: data.id,
      });
    }

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

    // Delete project_keys links first
    await supabase.from('project_keys').delete().eq('key_id', id);

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
