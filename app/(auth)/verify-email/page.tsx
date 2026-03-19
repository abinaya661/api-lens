'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  return (
    <div className="glass-card p-8 animate-fade-in text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-brand-600/20 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-brand-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>

      {error ? (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      ) : (
        <p className="text-sm text-zinc-400 mb-4">
          {email ? (
            <>
              We sent a link to{' '}
              <span className="text-white font-medium">{email}</span>
            </>
          ) : (
            'We sent you a verification link. Please check your inbox.'
          )}
        </p>
      )}

      <p className="text-xs text-zinc-600 mb-6">
        Didn&apos;t receive it? Check your spam folder or try again.
      </p>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-8 animate-fade-in text-center">
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
