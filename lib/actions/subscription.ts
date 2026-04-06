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
      .select('dodo_subscription_id, company_id')
      .eq('company_id', auth.companyId)
      .single();

    // Authorization: ensure the subscription belongs to the authenticated company
    // before any mutating operations (admin client bypasses RLS).
    if (sub?.company_id !== auth.companyId) {
      return { data: null, error: 'Unauthorized: subscription does not belong to your company.' };
    }

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
    try {
      const { error: dbError } = await adminSupabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('company_id', auth.companyId);

      if (dbError) throw dbError;
    } catch (dbError) {
      console.error(
        '[CRITICAL] Subscription cancelled at Dodo but DB update failed. Manual reconciliation required.',
        {
          dodoSubscriptionId: sub?.dodo_subscription_id,
          error: dbError,
        },
      );
      return {
        data: null,
        error: 'Subscription cancelled but our records could not be updated. Please contact support.',
      };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
