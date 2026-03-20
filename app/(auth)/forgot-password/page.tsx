'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/actions/auth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSent(true);
      toast.success('Password reset link sent!');
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
        <p className="text-sm text-zinc-500 mb-6">
          We sent a password reset link to <strong className="text-zinc-300">{email}</strong>
        </p>
        <Link
          href="/login"
          className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <h2 className="text-xl font-semibold text-white mb-1">Reset password</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
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
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
