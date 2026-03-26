'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { RevealOnScroll } from './reveal-on-scroll';
import { useRegionalPrice } from '@/hooks/use-regional-price';
import { formatPrice, formatProPrice } from '@/lib/regional-pricing';

const BASE_FEATURES = [
  '10 API keys on any supported platform',
  '1 seat for individual or solopreneurs',
  'Budget alerts',
  'Reports on monthly and weekly usage',
  'Project wise tracking',
];

const PRO_FEATURES = [
  'Includes all Base features',
  'Unlimited keys',
  'Multiple seats for teams and agencies',
  'Export in PDF and CSV',
  'API key status refreshes every few hours',
];

export function PricingSection() {
  const regional = useRegionalPrice();
  const baseMonthlyPrice = formatPrice(regional, 'monthly');
  const baseAnnualPrice = formatPrice(regional, 'annual');
  const proPrices = formatProPrice(regional);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
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
      const res = await fetch('/api/pro/waitlist', {
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
    <section id="pricing" className="py-16 md:py-24 px-6 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Enterprise-grade AI monitoring for the price of a coffee.
            </h2>
            <p className="text-zinc-400 text-lg">
              Stop losing money to shadow AI sprawl and ghost API keys.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 font-semibold text-sm">7 days free. No credit card required.</span>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="flex justify-center mb-10">
            <div className="bg-zinc-800/50 p-1 rounded-full inline-flex border border-zinc-700/50">
              <button
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-brand-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setBillingCycle('annual')}
              >
                Annual <span className="ml-2 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Save 17%</span>
              </button>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll stagger>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* The Cost of Inaction */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col justify-center">
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

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Base Card */}
              <div className="reveal rounded-2xl border-2 border-brand-500/50 bg-zinc-900/50 p-8 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <div className="mb-6 relative">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-semibold text-white">Base</h3>
                    {billingCycle === 'annual' && (
                      <span className="px-2.5 py-1 rounded-md bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">
                        Best Value
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm">Perfect for individuals and solopreneurs</p>
                </div>

                <div className="mb-8 relative flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white font-mono">
                    {billingCycle === 'monthly' ? baseMonthlyPrice : baseAnnualPrice}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1 relative">
                  {BASE_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-5 h-5 text-brand-400 flex-shrink-0" />
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

              {/* Pro Card */}
              <div className="reveal rounded-2xl border border-zinc-700 bg-zinc-900/30 p-8 flex flex-col relative overflow-hidden">
                <div className="mb-6 relative">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-semibold text-white">Pro</h3>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                      Invite Only
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">For teams that need scale</p>
                </div>

                <div className="mb-8 relative flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white font-mono">
                    {billingCycle === 'monthly' ? proPrices.monthly : proPrices.annual}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {PRO_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {notifyDone ? (
                  <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-center text-sm">
                    Thanks! We&apos;ll reach out soon.
                  </div>
                ) : (
                  <form onSubmit={handleNotifyMe} className="flex flex-col gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:border-zinc-500 transition-all"
                      required
                    />
                    {notifyError && (
                      <p className="text-red-400 text-xs">{notifyError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={notifyLoading || !notifyEmail.trim()}
                      className="w-full py-3.5 rounded-xl bg-zinc-700 text-white font-medium text-center hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {notifyLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        'Request Early Access'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <p className="text-center text-zinc-500 text-sm mt-8">
            Prices shown in your local currency. Final amount confirmed at checkout.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
