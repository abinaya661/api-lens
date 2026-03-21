'use client';

import { KeyRound, BarChart3, BellRing } from 'lucide-react';
import { RevealOnScroll } from './reveal-on-scroll';

const STEPS = [
  {
    number: '01',
    icon: KeyRound,
    title: 'Connect',
    description: 'Add your API keys from any provider. Keys are encrypted with AES-256-GCM.',
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Monitor',
    description: 'See real-time spend across all providers in one unified dashboard.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    number: '03',
    icon: BellRing,
    title: 'Optimize',
    description: 'Set budgets and get alerts before costs spiral out of control.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-6 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Get complete visibility into your AI spend in three simple steps.
          </p>
        </RevealOnScroll>

        <div className="relative">
          {/* Connecting dashed line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px border-t-2 border-dashed border-zinc-800" />

          <RevealOnScroll stagger>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {STEPS.map((step) => (
                <div key={step.number} className="text-center relative reveal">
                  {/* Number badge */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-zinc-800 bg-black text-zinc-500 font-mono text-sm font-bold mb-6 relative z-10">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center mx-auto mb-5`}>
                    <step.icon className="w-7 h-7" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
