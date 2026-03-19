'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, authRateLimit } from '@/lib/ratelimit';

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
