'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string }

// ─── Login ───────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Invalid input', field: issue?.path[0]?.toString() }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Never expose internal error details
    if (error.message.toLowerCase().includes('invalid login')) {
      return { ok: false, error: 'Invalid email or password.' }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  redirect('/dashboard')
}

// ─── Signup ──────────────────────────────────────────────────────────────────

const SignupSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email:     z.string().email('Enter a valid email address'),
  password:  z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

export async function signupAction(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Invalid input', field: issue?.path[0]?.toString() }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { ok: false, error: 'An account with this email already exists.', field: 'email' }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  return { ok: true }
}

// ─── Forgot password ─────────────────────────────────────────────────────────

const ForgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export async function forgotPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Invalid input', field: issue?.path[0]?.toString() }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings/security`,
  })

  if (error) {
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  return { ok: true }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function signInWithGoogleAction(): Promise<never> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
