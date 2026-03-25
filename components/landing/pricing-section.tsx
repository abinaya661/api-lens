'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { RevealOnScroll } from './reveal-on-scroll';
import { useRegionalPrice } from '@/hooks/use-regional-price';
import { formatPrice, formatEnterprisePrice } from '@/lib/regional-pricing';

const MONTHLY_FEATURES = [
  'Unlimited API keys & providers',
  'Real-time spend aggregation',
  'Granular budget alerts via Email & In-App',
  'End-to-end AES-256-GCM encryption',
  'Automated key rotation reminders',
  'Unlimited team members',
];

const ANNUAL_FEATURES = [
  'Everything in Monthly',
  'Priority support SLA',
  '2 months free',
  'Early access to features',
  'Custom data export API',
  'Dedicated onboarding',
];

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Dedicated account manager',
  'Custom integrations',
  'SSO (Single Sign-On)',
  'Audit logs',
  'SLA guarantee',
];

export function PricingSection() {
  const regional = useRegionalPrice();
  const monthlyPrice = formatPrice(regional, 'monthly');
  const annualPrice = formatPrice(regional, 'annual');
  const enterprisePrices = formatEnterprisePrice(regional);

  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  async function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyLoading(true);
    setNotifyError('');
    try {
      const res = await fetch('/api/enterprise/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Something went wrong');
      }
      setNotifyDone(true);
      setNotifyEmail('');
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <section className="py-16 md:py-24 px-6 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Enterprise-grade AI monitoring for the price of a coffee.
            </h2>
            <p className="text-zinc-400 text-lg">
              One plan. Everything included. Stop losing money to shadow AI sprawl and ghost API keys.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll stagger>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* The Cost of Inaction (Value Proposition Justification) */}
            <div className="lg:col-span-1 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">The Cost of Inaction</h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="text-sm text-zinc-300 leading-relaxed border-b border-red-500/10 pb-4">
                  <strong className="text-white block mb-1">A single leaked key:</strong>
                  Costs thousands of dollars in an hour before providers shut it down.
                </li>
                <li className="text-sm text-zinc-300 leading-relaxed border-b border-red-500/10 pb-4">
                  <strong className="text-white block mb-1">An infinite loop bug:</strong>
                  A developer pushes code that calls GPT-4 10,000 times overnight. You wake up to a $500 bill.
                </li>
                <li className="text-sm text-zinc-300 leading-relaxed">
                  <strong className="text-white block mb-1">Ghost subscriptions:</strong>
                  Teams expensing duplicate provider accounts because there&apos;s no central visibility.
                </li>
              </ul>
              <div className="p-4 rounded-xl bg-black border border-red-500/20 text-center">
                <p className="text-sm font-medium text-white mb-1">API Lens prevents this.</p>
                <p className="text-red-400 font-bold text-xl font-mono">ROI is mathematically guaranteed.</p>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Monthly Card */}
              <div className="reveal rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-1">Monthly</h3>
                  <p className="text-zinc-500 text-sm">Pay as you go</p>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-white font-mono">{monthlyPrice}</span>
                  <span className="text-zinc-500 text-sm ml-1">/mo</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {MONTHLY_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="w-full py-4 rounded-xl bg-zinc-800 text-white font-medium text-center hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Annual Card — Highlighted */}
              <div className="reveal rounded-2xl border-2 border-brand-500/50 bg-zinc-900/50 p-8 flex flex-col relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="mb-6 relative">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold text-white">Annual</h3>
                    <span className="px-2.5 py-1 rounded-md bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      Saves 17%
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">Best value for teams</p>
                </div>

                <div className="mb-8 relative">
                  <span className="text-5xl font-bold text-white font-mono">{annualPrice}</span>
                  <span className="text-zinc-500 text-sm ml-1">/yr</span>
                  <p className="text-brand-400 text-sm mt-2 font-medium">Get 2 months free</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1 relative">
                  {ANNUAL_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="w-full py-4 rounded-xl bg-brand-600 text-white font-medium text-center hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 relative shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Enterprise Card — Coming Soon */}
              <div className="reveal rounded-2xl border border-zinc-700 bg-zinc-900/30 p-8 flex flex-col relative overflow-hidden">
                <div className="mb-6 relative">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold text-white">Enterprise</h3>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">For teams that need more</p>
                </div>

                <div className="mb-8 relative">
                  <span className="text-5xl font-bold text-white font-mono">{enterprisePrices.monthly}</span>
                  <span className="text-zinc-500 text-sm ml-1">/mo</span>
                  <p className="text-zinc-500 text-sm mt-2">{enterprisePrices.annual}/yr</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {ENTERPRISE_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {notifyDone ? (
                  <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-center text-sm">
                    You&apos;re on the list! We&apos;ll notify you.
                  </div>
                ) : (
                  <form onSubmit={handleNotifyMe} className="flex flex-col gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:border-zinc-500 transition-all"
                      required
                    />
                    {notifyError && (
                      <p className="text-red-400 text-xs">{notifyError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={notifyLoading || !notifyEmail.trim()}
                      className="w-full py-3 rounded-xl bg-zinc-700 text-white font-medium text-center hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {notifyLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        'Notify Me'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <p className="text-center text-zinc-500 text-sm mt-4">
            Prices shown in your local currency. Final amount confirmed at checkout.
          </p>
        </RevealOnScroll>

        <RevealOnScroll>
          <p className="text-center text-zinc-500 text-sm mt-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            7-day free trial on all plans. Cancel anytime.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 22-8-4.8A2.78 2.78 0 0 1 2 14.8V6.11a2 2 0 0 1 1-1.74l8-4.74a2 2 0 0 1 2 0l8 4.74a2 2 0 0 1 1 1.74v8.69a2.78 2.78 0 0 1-2 2.39z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
