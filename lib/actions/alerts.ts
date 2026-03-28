'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import type { Alert } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function listAlerts(): Promise<ActionResult<Alert[]>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('company_id', auth.companyId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as Alert[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getUnreadAlertCount(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', auth.companyId)
      .eq('is_read', false);

    if (error) return { data: null, error: error.message };
    return { data: count ?? 0, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function markAlertRead(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id)
      .eq('company_id', auth.companyId);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function markAllAlertsRead(): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('company_id', auth.companyId)
      .eq('is_read', false);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
