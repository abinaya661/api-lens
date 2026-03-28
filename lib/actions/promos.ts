'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function redeemAccessPass(code: string): Promise<{
  success?: boolean;
  trialExtendsTo?: Date;
  days?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.userId || !auth.companyId) {
      return { error: auth.error ?? 'Not authenticated' };
    }

    const userId = auth.userId;
    const companyId = auth.companyId;

    // 2. Fetch the pass by code
    const { data: pass, error: passError } = await supabase
      .from('access_passes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (passError || !pass) {
      return { error: 'Invalid or inactive access pass code' };
    }

    // 3. Validate pass constraints
    if (pass.current_uses >= pass.max_uses) {
      return { error: 'This access pass has reached its maximum number of uses' };
    }
    if (pass.expires_at && new Date(pass.expires_at) < new Date()) {
      return { error: 'This access pass has expired' };
    }

    // 4. Check for existing redemption by this user
    const { data: existingRedemption } = await supabase
      .from('access_pass_redemptions')
      .select('id')
      .eq('pass_id', pass.id)
      .eq('user_id', userId)
      .single();

    if (existingRedemption) {
      return { error: 'You have already redeemed this access pass' };
    }

    // 5. Calculate new trial end date
    const days = pass.pass_type === '30_day' ? 30 : 15;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('trial_ends_at')
      .eq('company_id', companyId)
      .single();

    const now = new Date();
    const currentEnd = subscription?.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : now;
    const baseDate = currentEnd > now ? currentEnd : now;
    const newEnd = new Date(baseDate.getTime() + days * 86_400_000);

    // 6. Use admin client (service role) to write privileged updates
    const adminSupabase = getAdminClient();

    // Update subscription trial
    const { error: subError } = await adminSupabase
      .from('subscriptions')
      .update({
        trial_ends_at: newEnd.toISOString(),
        status: 'trialing',
        updated_at: now.toISOString(),
      })
      .eq('company_id', companyId);

    if (subError) {
      return { error: 'Failed to extend trial: ' + subError.message };
    }

    // Insert redemption record
    const { error: redemptionError } = await adminSupabase
      .from('access_pass_redemptions')
      .insert({
        pass_id: pass.id,
        user_id: userId,
        redeemed_at: now.toISOString(),
        trial_extended_to: newEnd.toISOString(),
      });

    if (redemptionError) {
      return { error: 'Failed to record redemption: ' + redemptionError.message };
    }

    // Increment usage count
    const { error: usageError } = await adminSupabase
      .from('access_passes')
      .update({ current_uses: pass.current_uses + 1 })
      .eq('id', pass.id);

    if (usageError) {
      console.error('Failed to increment pass usage count:', usageError);
    }

    // 7. Return success
    return { success: true, trialExtendsTo: newEnd, days };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getRedemptions(): Promise<{
  data: Array<{
    id: string;
    redeemed_at: string;
    trial_extended_to: string;
    access_passes: { code: string; pass_type: string; description: string | null } | null;
  }> | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('access_pass_redemptions')
      .select('id, redeemed_at, trial_extended_to, access_passes(code, pass_type, description)')
      .eq('user_id', user.id)
      .order('redeemed_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: data as any, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
