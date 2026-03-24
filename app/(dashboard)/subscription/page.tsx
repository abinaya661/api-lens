'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, SkeletonCard, ErrorState } from '@/components/shared';
import { useSubscription, useCancelSubscription } from '@/hooks/use-subscription';
import { useRegionalPrice } from '@/hooks/use-regional-price';
import { formatPrice } from '@/lib/regional-pricing';
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
import { Check, Crown, Zap, Shield, BarChart3, Clock, Headphones, Loader2 } from 'lucide-react';
import type { Subscription } from '@/types/database';
import type { RegionalPrice } from '@/lib/regional-pricing';

function buildPlans(regional: RegionalPrice) {
  return [
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: formatPrice(regional, 'monthly'),
      period: '/month',
      description: 'Flexible month-to-month billing',
      badge: null,
      highlighted: false,
    },
    {
      id: 'annual' as const,
      name: 'Annual',
      price: formatPrice(regional, 'annual'),
      period: '/year',
      description: 'Best value — 2 months free',
      badge: 'Recommended',
      highlighted: true,
    },
  ] as const;
}

const FEATURES = [
  { icon: Zap, text: 'Unlimited API key tracking' },
  { icon: BarChart3, text: 'Advanced usage analytics & reports' },
  { icon: Shield, text: 'Encrypted key storage (AES-256)' },
  { icon: Clock, text: 'Real-time budget alerts' },
  { icon: Crown, text: 'Priority access to new features' },
  { icon: Headphones, text: 'Email support' },
];

function getPlanLabel(plan: string | undefined | null): string {
  switch (plan) {
    case 'monthly': return 'Monthly Plan';
    case 'annual': return 'Annual Plan';
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
              : 'You are on the free trial. Upgrade to unlock all features.'}
          </p>
        </div>
        <Badge variant={getPlanBadgeVariant(isActive ? plan : null)}>{getPlanLabel(isActive ? plan : null)}</Badge>
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
            Trial ends on{' '}
            <span className="text-zinc-200 font-medium">
              {formatDate(subscription.trial_ends_at)}
            </span>
          </p>
        </>
      )}
    </div>
  );
}

function PricingCard({
  plan,
  currentPlan,
  onSubscribe,
  isLoading,
  loadingPlan,
}: {
  plan: { id: 'monthly' | 'annual'; name: string; price: string; period: string; description: string; badge: string | null; highlighted: boolean };
  currentPlan: string | undefined | null;
  onSubscribe: (planId: 'monthly' | 'annual') => void;
  isLoading: boolean;
  loadingPlan: 'monthly' | 'annual' | null;
}) {
  const isCurrentPlan = currentPlan === plan.id;
  const isThisLoading = isLoading && loadingPlan === plan.id;

  return (
    <Card
      className={`relative flex flex-col transition-all ${
        plan.highlighted
          ? 'border-brand-500/60 shadow-lg shadow-brand-500/10 bg-zinc-900/80'
          : 'border-zinc-800 bg-zinc-900/40'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-brand-600 text-white border-0 shadow-md px-3 py-0.5 text-xs">
            {plan.badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-8">
        <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
        <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center flex-1">
        <div className="my-6">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-zinc-500 text-sm ml-1">{plan.period}</span>
        </div>

        <ul className="space-y-3 text-left">
          {FEATURES.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3 text-sm">
              <Check className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <span className="text-zinc-300">{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className={`w-full ${
              plan.highlighted ? 'bg-brand-600 hover:bg-brand-700 text-white' : ''
            }`}
            variant={plan.highlighted ? 'default' : 'outline'}
            disabled={isLoading}
            onClick={() => onSubscribe(plan.id)}
          >
            {isThisLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout...</>
            ) : (
              'Subscribe'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function SubscriptionPage() {
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const regional = useRegionalPrice();
  const PLANS = buildPlans(regional);

  async function handleSubscribe(plan: 'monthly' | 'annual') {
    setCheckoutLoading(true);
    setLoadingPlan(plan);

    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, discountCode: promoCode || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Failed to create checkout session');
      }

      const data = await res.json() as { checkout_url?: string };

      if (!data.checkout_url) {
        throw new Error('No checkout URL returned from payment provider');
      }

      // Redirect to Dodo Payments checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Checkout failed', { description: message });
      console.error('Checkout error:', err);
      setCheckoutLoading(false);
      setLoadingPlan(null);
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

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Subscription"
        description="Manage your plan and billing. Choose the plan that works best for you."
      />

      <CurrentPlanCard subscription={subscription} />

      <div>
        <h3 className="text-lg font-medium text-white mb-1">
          {currentPlan ? 'Change Plan' : 'Choose a Plan'}
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          All plans include every feature. No hidden fees. Global checkout powered by Dodo Payments.
        </p>

        {/* Promo code input */}
        <div className="flex gap-2 max-w-sm mb-6">
          <Input
            placeholder="Promo code (optional)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              onSubscribe={handleSubscribe}
              isLoading={checkoutLoading}
              loadingPlan={loadingPlan}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          You can also enter a promo code directly on the checkout page.
        </p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-medium text-white mb-4">Everything included in your plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.text}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50"
              >
                <div className="w-8 h-8 rounded-md bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-sm text-zinc-300 mt-1">{feature.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-sm text-zinc-500">
          Questions about billing?{' '}
          <a
            href="mailto:support@apilens.dev"
            className="text-brand-400 hover:text-brand-300 underline underline-offset-4"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
