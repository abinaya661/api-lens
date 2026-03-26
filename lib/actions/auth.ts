'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, authRateLimit } from '@/lib/ratelimit';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface AuthResult {
  success: boolean;
  error: string | null;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  const rl = await checkRateLimit(authRateLimit, `login:${email}`);
  if (!rl.success) {
    return { success: false, error: 'Too many login attempts. Try again in a minute.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function signupWithEmail(
  companyName: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const rl = await checkRateLimit(authRateLimit, `signup:${email}`);
  if (!rl.success) {
    return { success: false, error: 'Too many signup attempts. Try again in a minute.' };
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const cookieStore = await cookies();
  const geoCountry = cookieStore.get('geo_country')?.value;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { 
        company_name: companyName,
        ...(geoCountry && { geo_country: geoCountry }),
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const rl = await checkRateLimit(authRateLimit, `reset:${email}`);
  if (!rl.success) {
    return { success: false, error: 'Too many reset attempts. Try again in a minute.' };
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/settings`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
