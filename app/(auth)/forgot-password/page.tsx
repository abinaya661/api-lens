'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { forgotPasswordAction } from '../actions'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'
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
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, null)

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
          <MailCheck className="h-10 w-10 text-success" />
          <h2 className="text-base font-semibold text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a password reset link. Check your spam folder if you don&apos;t see it.
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
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <p className="text-sm text-muted-foreground mb-5">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
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

          {state?.ok === false ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </div>
  )
}
