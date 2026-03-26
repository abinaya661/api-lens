'use server';

import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/settings';
import type { Profile } from '@/types/database';

export interface NotificationPrefs {
  budget_alerts_email: boolean;
  key_validation_failure_email: boolean;
  trial_ending_reminder_email: boolean;
  weekly_spending_report_email: boolean;
  key_rotation_reminder_email: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  budget_alerts_email: true,
  key_validation_failure_email: true,
  trial_ending_reminder_email: true,
  weekly_spending_report_email: false,
  key_rotation_reminder_email: false,
};

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
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
    const prefs = (data?.notification_prefs as NotificationPrefs | null) ?? DEFAULT_NOTIFICATION_PREFS;
    return { data: { ...DEFAULT_NOTIFICATION_PREFS, ...prefs }, error: null };
  } catch (e) {
    return { data: DEFAULT_NOTIFICATION_PREFS, error: null };
  }
}

export async function updateNotificationPrefs(prefs: NotificationPrefs): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: prefs })
      .eq('id', user.id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
