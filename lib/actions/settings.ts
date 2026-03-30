'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_NOTIFICATION_PREFS,
  notificationPrefsSchema,
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/settings';
import type { NotificationPrefs, Profile } from '@/types/database';

export type { NotificationPrefs } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

function normalizeNotificationPrefs(value: unknown): NotificationPrefs {
  const parsed = notificationPrefsSchema.safeParse(value);
  if (!parsed.success) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  return parsed.data;
}

export async function getProfile(): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<Profile>> {
  try {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .update(parsed.data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
export async function getNotificationPrefs(): Promise<{ data: NotificationPrefs | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', user.id)
      .single();

    if (error) return { data: DEFAULT_NOTIFICATION_PREFS, error: null };
    return { data: normalizeNotificationPrefs(data?.notification_prefs), error: null };
  } catch (_e) {
    return { data: DEFAULT_NOTIFICATION_PREFS, error: null };
  }
}

export async function updateNotificationPrefs(prefs: NotificationPrefs): Promise<{ error: string | null }> {
  try {
    const parsed = notificationPrefsSchema.safeParse(prefs);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: parsed.data })
      .eq('id', user.id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (_e) {
    return { error: _e instanceof Error ? _e.message : 'Unknown error' };
  }
}
