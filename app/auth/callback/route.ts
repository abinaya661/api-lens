import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirect } from '@/lib/utils/safe-redirect';
import { sendEmail, getWelcomeEmailHtml } from '@/lib/email/resend';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirect(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;
  const metadata = user.user_metadata || {};
  let needsUpdate = false;
  const updates: Record<string, unknown> = {};

  // Check geo_country
  if (!metadata.geo_country) {
    const cookieStore = await cookies();
    const geoCountry = cookieStore.get('geo_country')?.value;
    if (geoCountry) {
      updates.geo_country = geoCountry;
      needsUpdate = true;
    }
  }

  // Check Welcome Email
  if (!metadata.welcome_email_sent) {
    updates.welcome_email_sent = true;
    needsUpdate = true;
    
    // Send Welcome Email asynchronously
    sendEmail({
      to: user.email!,
      subject: 'Welcome to API Lens! 🚀',
      html: getWelcomeEmailHtml(),
    }).catch((err: unknown) => console.error('[Welcome Email]', err));
  }

  if (needsUpdate) {
    await supabase.auth.updateUser({ data: updates });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
