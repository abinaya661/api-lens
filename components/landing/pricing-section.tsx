'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { RevealOnScroll } from './reveal-on-scroll';

const MONTHLY_FEATURES = [
  'Unlimited API keys',
  'All 14 providers',
  'Budget alerts',
  'Email reports',
  'Spend analytics',
  'Team dashboard',
];

const ANNUAL_FEATURES = [
  'Everything in Monthly',
  'Priority support',
  '2 months free',
  'Early access to features',
  'Advanced analytics',
  'Custom budgets',
];

export function PricingSection() {
  return (
    <section className="py-24 px-6 border-t border-zinc-800">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            One plan. Everything included. Start free, upgrade when you&apos;re ready.
          </p>
        </RevealOnScroll>

        <RevealOnScroll stagger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly Card */}
            <div className="reveal rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Monthly</h3>
                <p className="text-zinc-500 text-sm">Pay as you go</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white font-mono">$5.99</span>
                <span className="text-zinc-500 text-sm ml-1">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {MONTHLY_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="w-full py-3 rounded-xl bg-zinc-800 text-white font-medium text-center hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
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
                  <h3 className="text-lg font-semibold text-white">Annual</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">Best value — save 17%</p>
              </div>

              <div className="mb-8 relative">
                <span className="text-4xl font-bold text-white font-mono">$59.99</span>
                <span className="text-zinc-500 text-sm ml-1">/year</span>
                <p className="text-brand-400 text-sm mt-1 font-medium">2 months free</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1 relative">
                {ANNUAL_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium text-center hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 relative"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <p className="text-center text-zinc-500 text-sm mt-8">
            7-day free trial on all plans. Cancel anytime. No credit card required.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
