'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dodo } from '@/lib/dodo/client';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import type { Subscription } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function getSubscription(): Promise<ActionResult<Subscription | null>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', auth.companyId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data: (data as Subscription | null) ?? null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function cancelSubscription(): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id')
      .eq('company_id', auth.companyId)
      .single();

    if (sub?.dodo_subscription_id) {
      try {
        await dodo.subscriptions.update(sub.dodo_subscription_id, {
          status: 'cancelled',
        } as Parameters<typeof dodo.subscriptions.update>[1]);
      } catch (dodoErr) {
        console.error('[cancel] Dodo API call failed:', dodoErr);
        return {
          data: null,
          error: 'Failed to cancel with payment provider. Please try again or contact support.',
        };
      }
    }

    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('company_id', auth.companyId);

    if (dbError) {
      console.error('[cancel] DB update failed:', dbError);
      return { data: null, error: 'Subscription cancelled but failed to update local records. Please refresh.' };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
