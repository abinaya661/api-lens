import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, sendEmail, getWaitlistConfirmationEmailHtml } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
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
    .from('pro_waitlist')
    .upsert(
      { email, country_code: body.country_code ?? null },
      { onConflict: 'email', ignoreDuplicates: true },
    );

  if (error) {
    console.error('[pro/waitlist] DB error:', error);
    // Provide a more specific error if it's a known issue like missing table
    if (error.code === '42P01') {
      return Response.json({ error: 'Database table missing. Please contact support.' }, { status: 500 });
    }
    return Response.json({ error: 'Failed to save your email. Please try again.' }, { status: 500 });
  }

  // Add to Resend audience if configured
  if (resend && process.env.RESEND_PRO_WAITLIST_ID) {
    try {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_PRO_WAITLIST_ID,
      });
    } catch (err: unknown) {
      console.error('[pro/waitlist] Resend audience error:', err);
    }
  }

  // Send confirmation email
  await sendEmail({
    to: email,
    subject: "You're on the API Lens Pro waitlist!",
    html: getWaitlistConfirmationEmailHtml(),
  });

  return Response.json({ success: true });
}
