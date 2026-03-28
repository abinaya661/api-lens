import { createClient } from '@/lib/supabase/server';

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getAuthenticatedUser(
  supabase: ServerSupabase,
): Promise<{ userId: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, error: 'Not authenticated' };
  }

  return { userId: user.id, error: null };
}

export async function getAuthenticatedCompany(
  supabase: ServerSupabase,
): Promise<{ userId: string | null; companyId: string | null; error: string | null }> {
  const auth = await getAuthenticatedUser(supabase);
  if (auth.error || !auth.userId) {
    return { userId: null, companyId: null, error: auth.error ?? 'Not authenticated' };
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', auth.userId)
    .single();

  if (error || !company) {
    return {
      userId: auth.userId,
      companyId: null,
      error: error?.message ?? 'Company not found',
    };
  }

  return { userId: auth.userId, companyId: company.id, error: null };
}
