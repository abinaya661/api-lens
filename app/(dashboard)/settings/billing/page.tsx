'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CreditCard, Tag, CalendarDays, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { PageHeader, SkeletonCard, ErrorState } from '@/components/shared';
import { useSubscription, useCancelSubscription } from '@/hooks/use-subscription';
import { redeemAccessPass } from '@/lib/actions/promos';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysLeft(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function getPlanLabel(plan: string | null | undefined, status?: string): string {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'trialing') return 'Free Trial';
  switch (plan) {
    case 'monthly': return 'Monthly';
    case 'annual':  return 'Annual';
    default:        return 'Free Trial';
  }
}

// ── PromoCodeSection ─────────────────────────────────────────────────────────

function PromoCodeSection() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const result = await redeemAccessPass(code.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Access pass applied! Trial extended by ${result.days} days — now active until ${formatDate(result.trialExtendsTo?.toISOString())}.`
        );
        setCode('');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-brand-500/10 flex items-center justify-center">
          <Tag className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <h3 className="text-base font-medium text-white">Access Pass / Promo Code</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Enter a code to extend your trial for free.</p>
        </div>
      </div>

      <hr className="border-zinc-800" />

      <form onSubmit={handleApply} className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER-CODE"
          className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                     tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          maxLength={32}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium
                     hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Applying...
            </>
          ) : (
            'Apply'
          )}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const cancelMutation = useCancelSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Billing & Subscription" description="Manage your plan, payment, and promo codes." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Billing & Subscription" description="Manage your plan, payment, and promo codes." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const status = subscription?.status ?? 'trialing';
  const plan = subscription?.plan ?? null;
  const isActive = status === 'active';
  const isTrialing = status === 'trialing';
  const isCancelled = status === 'cancelled';
  const trialEnd = subscription?.trial_ends_at;
  const periodEnd = subscription?.period_end;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan, payment, and promo codes."
      />

      {/* ── Plan Status Card ── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
              <CreditCard className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Current plan</p>
              <h3 className="text-xl font-semibold text-white mt-0.5">{getPlanLabel(plan, status)}</h3>
            </div>
          </div>

          {/* Status badge */}
          {isActive && !isCancelled && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
              Active
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
              Cancels at period end
            </span>
          )}
          {isTrialing && !isActive && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-400 border border-brand-500/20">
              Trial
            </span>
          )}
        </div>

        <hr className="border-zinc-800" />

        {/* Trialing details */}
        {isTrialing && !isActive && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-500/5 border border-brand-500/20">
            <CalendarDays className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {trialEnd ? (
                <>
                  <p className="text-sm text-zinc-300">
                    Your card will be charged automatically on{' '}
                    <span className="text-white font-medium">{formatDate(trialEnd)}</span>.
                    Cancel anytime before.
                  </p>
                  <p className="text-xs text-zinc-500">
                    {daysLeft(trialEnd)} day{daysLeft(trialEnd) !== 1 ? 's' : ''} remaining.
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-400">You are on the free trial.</p>
              )}
            </div>
          </div>
        )}

        {/* Active subscription details */}
        {isActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Billing cycle</p>
              <p className="text-zinc-200 font-medium capitalize">{plan}</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                {isCancelled ? 'Access until' : 'Next billing date'}
              </p>
              <p className="text-zinc-200 font-medium">{formatDate(periodEnd)}</p>
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {isCancelled && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300">Your subscription has been cancelled.</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                You will retain access until <span className="text-zinc-300">{formatDate(periodEnd)}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Upgrade button: show when trialing or cancelled */}
          {(isTrialing || isCancelled) && (
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium
                         hover:bg-brand-700 transition-all"
            >
              {isCancelled ? 'Re-subscribe' : 'Upgrade to Pro'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Cancel button: only when active and not already cancelling */}
          {isActive && !isCancelled && (
            <>
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium
                             hover:text-red-400 hover:border-red-500/50 transition-all"
                >
                  Cancel Subscription
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-zinc-400">Are you sure you want to cancel?</span>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-all"
                  >
                    Keep Plan
                  </button>
                  <button
                    disabled={cancelMutation.isPending}
                    onClick={() =>
                      cancelMutation.mutate(undefined, {
                        onSuccess: () => setShowCancelConfirm(false),
                      })
                    }
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                               hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                               flex items-center gap-2"
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* View full subscription page */}
          <Link
            href="/subscription"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View plans
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Promo Code Section ── */}
      <PromoCodeSection />
    </div>
  );
}
