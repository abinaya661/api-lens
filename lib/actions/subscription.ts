'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dodo } from '@/lib/dodo/client';
import type { Subscription } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function getSubscription(): Promise<ActionResult<Subscription>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null };
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function cancelSubscription(): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (sub?.dodo_subscription_id) {
      await dodo.subscriptions.update(sub.dodo_subscription_id, {
        status: 'cancelled',
      } as Parameters<typeof dodo.subscriptions.update>[1]);
    }

    const adminSupabase = createAdminClient();
    await adminSupabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
