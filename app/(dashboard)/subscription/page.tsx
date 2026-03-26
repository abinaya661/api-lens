'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, SkeletonCard, ErrorState } from '@/components/shared';
import { useSubscription, useCancelSubscription } from '@/hooks/use-subscription';
import { useRegionalPrice } from '@/hooks/use-regional-price';
import { formatPrice, formatProPrice } from '@/lib/regional-pricing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Check, Loader2, CheckCircle2 } from 'lucide-react';
import type { Subscription } from '@/types/database';


const BASE_FEATURES = [
  '10 API keys on any supported platform',
  '1 seat for individual or solopreneurs',
  'Budget alerts',
  'Reports on monthly and weekly usage',
  'Project wise tracking',
  'Update usage every hour',
];

const PRO_FEATURES = [
  'Unlimited keys',
  'Multiple seats for teams and agencies',
  'Downloadable reports',
  'Unlimited refresh',
  '15 minute update on usage',
];

function getPlanLabel(plan: string | undefined | null): string {
  switch (plan) {
    case 'monthly': return 'Base Monthly';
    case 'annual': return 'Base Annual';
    case 'trialing': return 'Free Trial';
    default: return 'Free Trial';
  }
}

function getPlanBadgeVariant(plan: string | undefined | null): 'default' | 'secondary' | 'outline' {
  switch (plan) {
    case 'monthly':
    case 'annual':
      return 'default';
    default:
      return 'secondary';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function CurrentPlanCard({ subscription }: { subscription: Subscription | null | undefined }) {
  const cancelMutation = useCancelSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const plan = subscription?.plan ?? null;
  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Current Plan</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {isActive && plan
              ? `Your ${plan} subscription is active.`
              : isCancelled
                ? 'Your subscription has been cancelled.'
                : 'You are on the free trial. Upgrade to unlock all features.'}
          </p>
        </div>
        <Badge variant={isCancelled ? 'destructive' : getPlanBadgeVariant(isActive ? plan : null)}>
          {isCancelled ? 'Cancelled' : getPlanLabel(isActive ? plan : null)}
        </Badge>
      </div>

      {isActive && (
        <>
          <hr className="border-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Billing cycle</span>
              <p className="text-zinc-200 font-medium mt-0.5 capitalize">{plan}</p>
            </div>
            <div>
              <span className="text-zinc-500">Period ends</span>
              <p className="text-zinc-200 font-medium mt-0.5">
                {formatDate(subscription?.period_end ?? null)}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Status</span>
              <p className="mt-0.5">
                {isCancelled ? (
                  <Badge variant="destructive">Cancels at period end</Badge>
                ) : (
                  <Badge variant="default">Active</Badge>
                )}
              </p>
            </div>
          </div>

          {!isCancelled && (
            <div className="flex justify-end pt-2">
              {!showCancelConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-zinc-400 hover:text-red-400 hover:border-red-500/50"
                >
                  Cancel Subscription
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">Are you sure?</span>
                  <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(false)}>
                    Keep Plan
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      cancelMutation.mutate(undefined, {
                        onSuccess: () => setShowCancelConfirm(false),
                      });
                    }}
                  >
                    {cancelMutation.isPending ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Cancelling...</>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!isActive && subscription?.trial_ends_at && (
        <>
          <hr className="border-zinc-800" />
          <p className="text-sm text-zinc-400">
            Your free trial ends on{' '}
            <span className="text-zinc-200 font-medium">
              {formatDate(subscription.trial_ends_at)}
            </span>
            . Subscribe to the Base Plan to keep access.
          </p>
        </>
      )}
    </div>
  );
}

function PaymentSuccessOverlay() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    window.history.replaceState({}, '', '/subscription');
    const timer = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-10 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
        <p className="text-zinc-400">
          Thank you for subscribing. Your plan is now active.
        </p>
        <p className="text-sm text-zinc-500">
          Redirecting to dashboard in {countdown}...
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}

function SubscriptionPageInner() {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const regional = useRegionalPrice();
  
  // Waitlist states
  const [email, setEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowSuccess(true);
    }
  }, [searchParams]);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billingCycle, discountCode: promoCode || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Failed to create checkout session');
      }

      const data = await res.json() as { checkout_url?: string };

      if (!data.checkout_url) throw new Error('No checkout URL returned from payment provider');
      window.location.href = data.checkout_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Checkout failed', { description: message });
      setCheckoutLoading(false);
    }
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      const res = await fetch('/api/pro/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('Something went wrong');
      setWaitlistDone(true);
      setEmail('');
    } catch {
      setWaitlistError('Failed to save. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Subscription" description="Manage your plan and billing." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Subscription" description="Manage your plan and billing." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const currentPlan = subscription?.status === 'active' ? subscription?.plan : null;
  const baseMonthlyPrice = formatPrice(regional, 'monthly');
  const baseAnnualPrice = formatPrice(regional, 'annual');
  const proPrices = formatProPrice(regional);

  return (
    <>
      {showSuccess && <PaymentSuccessOverlay />}
      <div className="animate-fade-in space-y-8">
        <PageHeader
          title="Subscription"
          description="Manage your plan and billing. We strictly offer a Base tier explicitly, with Pro being invite-only."
        />

        <CurrentPlanCard subscription={subscription} />

        <div>
          <h3 className="text-lg font-medium text-white mb-4">
            {currentPlan ? 'Change Billing Cycle' : 'Choose a Plan'}
          </h3>

          <div className="flex gap-2 max-w-sm mb-6">
            <Input
              placeholder="Promo code (optional)"
              value={promoCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromoCode(e.target.value.toUpperCase())}
              className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="flex mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 inline-flex">
              <button
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setBillingCycle('annual')}
              >
                Annual <span className="bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded textxs font-bold uppercase">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Base Card */}
            <Card className="relative flex flex-col border-brand-500/30 bg-zinc-900/50 shadow-lg shadow-brand-500/5">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-xl text-white">Base</CardTitle>
                <CardDescription className="text-zinc-400">Perfect for individuals and solopreneurs</CardDescription>
              </CardHeader>

              <CardContent className="text-center flex-1">
                <div className="my-6">
                  <span className="text-4xl font-bold text-white">
                    {billingCycle === 'monthly' ? baseMonthlyPrice : baseAnnualPrice}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul className="space-y-3 text-left">
                  {BASE_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {currentPlan === billingCycle ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-white text-black hover:bg-zinc-200"
                    disabled={checkoutLoading}
                    onClick={handleSubscribe}
                  >
                    {checkoutLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                    ) : (
                      currentPlan ? 'Switch Plan' : 'Subscribe'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Pro Card */}
            <Card className="relative flex flex-col border-zinc-800 bg-zinc-900/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-zinc-800 text-zinc-300 shadow-md">Invite Only</Badge>
              </div>

              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-xl text-white">Pro</CardTitle>
                <CardDescription className="text-zinc-500">For teams that need scale</CardDescription>
              </CardHeader>

              <CardContent className="text-center flex-1">
                <div className="my-6">
                  <span className="text-4xl font-bold text-zinc-100">
                    {billingCycle === 'monthly' ? proPrices.monthly : proPrices.annual}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul className="space-y-3 text-left">
                  {PRO_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                      <span className="text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {waitlistDone ? (
                  <div className="w-full py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-center text-sm">
                    Thanks! We&apos;ll reach out soon.
                  </div>
                ) : (
                  <form onSubmit={handleNotify} className="w-full flex flex-col gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                    {waitlistError && <p className="text-red-400 text-xs">{waitlistError}</p>}
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full border-zinc-800"
                      disabled={waitlistLoading || !email.trim()}
                    >
                      {waitlistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Early Access'}
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          </div>
          <p className="text-xs text-zinc-500 mt-4 max-w-2xl">
            Prices shown in your local currency. Final amount confirmed at checkout.
          </p>
        </div>
      </div>
    </>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in space-y-6">
          <PageHeader title="Subscription" description="Manage your plan and billing." />
          <SkeletonCard />
        </div>
      }
    >
      <SubscriptionPageInner />
    </Suspense>
  );
}
