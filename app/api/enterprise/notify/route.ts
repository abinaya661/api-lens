import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; country_code?: string };
  try {
    body = await req.json() as { email?: string; country_code?: string };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('enterprise_waitlist')
    .upsert(
      { email, country_code: body.country_code ?? null },
      { onConflict: 'email', ignoreDuplicates: true },
    );

  if (error) {
    console.error('[enterprise/notify] DB error:', error);
    return Response.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }

  return Response.json({ success: true });
}
