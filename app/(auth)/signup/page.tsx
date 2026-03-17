'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signupAction, signInWithGoogleAction } from '../actions'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
        'bg-primary text-white text-sm font-medium',
        'hover:bg-primary-hover transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card'
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, null)

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="white" />
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="white" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">API Lens</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <h2 className="text-base font-semibold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link href="/login" className="text-sm text-primary hover:underline font-medium mt-1">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="white" />
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="white" opacity="0.5" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">API Lens</h1>
        <p className="text-sm text-muted-foreground">Create your free account</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Google OAuth */}
        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className={cn(
              'w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg',
              'border text-sm font-medium text-foreground',
              'hover:bg-elevated transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card'
            )}
            style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 text-muted-foreground" style={{ backgroundColor: 'var(--bg-card)' }}>
              or continue with email
            </span>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm text-foreground',
                'bg-background border outline-none transition-colors',
                'placeholder:text-muted-foreground',
                'focus:ring-2 focus:ring-ring',
                state?.ok === false && state.field === 'full_name'
                  ? 'border-destructive'
                  : 'border-border focus:border-primary'
              )}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm text-foreground',
                'bg-background border outline-none transition-colors',
                'placeholder:text-muted-foreground',
                'focus:ring-2 focus:ring-ring',
                state?.ok === false && state.field === 'email'
                  ? 'border-destructive'
                  : 'border-border focus:border-primary'
              )}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm text-foreground',
                'bg-background border outline-none transition-colors',
                'placeholder:text-muted-foreground',
                'focus:ring-2 focus:ring-ring',
                state?.ok === false && state.field === 'password'
                  ? 'border-destructive'
                  : 'border-border focus:border-primary'
              )}
            />
          </div>

          {state?.ok === false ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <SubmitButton />

          <p className="text-center text-xs text-muted-foreground">
            By creating an account you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.68 3.68 0 01-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.88z" fill="#4285F4" />
      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2c-.71.48-1.63.76-2.71.76-2.08 0-3.84-1.4-4.47-3.29H.87v2.07A8 8 0 008 16z" fill="#34A853" />
      <path d="M3.53 9.53A4.8 4.8 0 013.28 8c0-.53.09-1.04.25-1.53V4.4H.87A8 8 0 000 8c0 1.29.31 2.51.87 3.6l2.66-2.07z" fill="#FBBC05" />
      <path d="M8 3.18c1.17 0 2.22.4 3.05 1.2l2.28-2.28A8 8 0 008 0 8 8 0 00.87 4.4l2.66 2.07C4.16 4.59 5.92 3.18 8 3.18z" fill="#EA4335" />
    </svg>
  )
}
