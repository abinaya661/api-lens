'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangingCode, setExchangingCode] = useState(false);
  const [codeExchanged, setCodeExchanged] = useState(false);
  const [done, setDone] = useState(false);

  // If a code is present in the URL, exchange it for a session immediately
  useEffect(() => {
    if (!code) return;

    async function exchangeCode() {
      setExchangingCode(true);
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code!);
      if (error) {
        toast.error('Invalid or expired reset link. Please request a new one.');
      } else {
        setCodeExchanged(true);
      }
      setExchangingCode(false);
    }

    exchangeCode();
  }, [code]);

  // Mode 1: No code in URL — send reset email
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      toast.success('Check your email for a password reset link.');
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Mode 2: Code exchanged — set new password
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      toast.success('Password updated successfully!');
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // --- Exchanging code in progress ---
  if (code && exchangingCode) {
    return (
      <div className="glass-card p-8 animate-fade-in text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Verifying reset link&hellip;</p>
      </div>
    );
  }

  // --- Code invalid / expired (no exchange succeeded) ---
  if (code && !exchangingCode && !codeExchanged) {
    return (
      <div className="glass-card p-8 animate-fade-in text-center space-y-4">
        <div className="text-red-400 text-4xl">&#x26A0;</div>
        <h2 className="text-xl font-semibold text-white">Reset link invalid</h2>
        <p className="text-sm text-zinc-500">
          This link has expired or already been used. Request a new one below.
        </p>
        <Link href="/reset-password" className="inline-block mt-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
          Request a new link &rarr;
        </Link>
      </div>
    );
  }

  // --- Mode 2: Set new password (code successfully exchanged) ---
  if (code && codeExchanged) {
    if (done) {
      return (
        <div className="glass-card p-8 animate-fade-in text-center space-y-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Password updated!</h2>
          <p className="text-sm text-zinc-500">Your password has been changed successfully.</p>
          <Link href="/login" className="inline-block mt-2 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-all">
            Sign in
          </Link>
        </div>
      );
    }

    return (
      <div className="glass-card p-8 animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">Set new password</h2>
        <p className="text-sm text-zinc-500 mb-6">Choose a strong password with at least 8 characters.</p>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-zinc-400 mb-1.5">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium
                       hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    );
  }

  // --- Mode 1: No code — send reset email ---
  if (done) {
    return (
      <div className="glass-card p-8 animate-fade-in text-center space-y-4">
        <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Check your email</h2>
        <p className="text-sm text-zinc-500">
          We sent a password reset link to <span className="text-zinc-300">{email}</span>.
          Check your inbox and click the link to reset your password.
        </p>
        <p className="text-xs text-zinc-600">
          Didn&apos;t receive it?{' '}
          <button onClick={() => setDone(false)} className="text-brand-400 hover:text-brand-300 transition-colors underline">
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <h2 className="text-xl font-semibold text-white mb-2">Reset your password</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSendEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium
                     hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-8 animate-fade-in text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
