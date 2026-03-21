'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { RevealOnScroll } from './reveal-on-scroll';

export function SecurityCallout() {
  return (
    <section className="py-20 px-6 border-t border-zinc-800">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll>
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 md:p-12 overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start gap-6 relative">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                  Your keys are safe. We literally can&apos;t read them.
                </h3>
                <p className="text-zinc-400 leading-relaxed mb-5">
                  API Lens uses AES-256-GCM envelope encryption with a write-only master key.
                  Even we cannot decrypt your stored credentials.
                </p>
                <Link
                  href="/security"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors group"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
