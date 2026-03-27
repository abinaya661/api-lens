import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ProviderMarquee } from '@/components/landing/provider-marquee';
import { PricingSection } from '@/components/landing/pricing-section';
import { SecurityCallout } from '@/components/landing/security-callout';
import { RevealOnScroll } from '@/components/landing/reveal-on-scroll';
import { RegionalPriceText } from '@/components/landing/regional-price-text';
import { JsonLd } from '@/components/shared/json-ld';
import { buildSoftwareApplicationSchema, buildHomepageFAQSchema } from '@/lib/structured-data';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-brand-500/30 relative overflow-x-hidden">
      {/* Homepage structured data */}
      <JsonLd data={buildSoftwareApplicationSchema()} />
      <JsonLd data={buildHomepageFAQSchema()} />
      {/* Global dot grid background */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none" />
      {/* ─── S1: Sticky Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">API Lens</span>
            </div>
            <Link href="/blog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">Insights</Link>
            <Link href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-zinc-100 text-black hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* ========================================== */}
        {/* LAYER 1: STICKY HERO BACKGROUND            */}
        {/* ========================================== */}
        <div className="sticky top-0 h-[100svh] w-full flex flex-col justify-center bg-black z-0 overflow-hidden pt-16">
          <section className="relative px-6">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* C1: Replaced fake metric with genuine social proof */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              Built for teams shipping AI products
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
              The ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                API key manager.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The single dashboard to monitor, budget, and attribute AI API usage
              across OpenAI, Anthropic, Gemini, and 10+ other providers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
              >
                Start your 7-day free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* B2: Fixed link from /dashboard to #dashboard-preview */}
              <Link
                href="#dashboard-preview"
                aria-label="Scroll to interactive dashboard preview"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium hover:bg-zinc-800 transition-all flex items-center justify-center"
              >
                View Live Demo
              </Link>
            </div>
            {/* C3: Added annual pricing option */}
            <p className="text-sm text-zinc-500 mt-6">
              <RegionalPriceText />
            </p>
          </div>
          </section>
        </div>

        {/* ========================================== */}
        {/* LAYER 2: DASHBOARD PREVIEW OVERLAY         */}
        {/* ========================================== */}
        <div className="relative z-10 w-full bg-zinc-950 border-t border-zinc-800 shadow-[0_-40px_80px_rgba(0,0,0,0.8)] rounded-t-[2.5rem] md:rounded-t-[3rem] pt-12 pb-16">
          <DashboardPreview />
        </div>

        {/* ========================================== */}
        {/* LAYER 3: MAIN CONTENT OVERLAY              */}
        {/* ========================================== */}
        <div className="relative z-20 w-full bg-black border-t border-zinc-800 shadow-[0_-40px_80px_rgba(0,0,0,1)] rounded-t-[2.5rem] md:rounded-t-[3rem] pt-8">
          {/* ─── S3: Three Value Pillars ─── */}
          <section className="py-16 px-6 bg-zinc-900/30 border-b border-zinc-800 rounded-t-[2.5rem] md:rounded-t-[3rem]">
          <div className="max-w-7xl mx-auto">
            <RevealOnScroll stagger>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors reveal">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Unified Dashboard</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Connect all your providers and see exactly which projects and models are driving your AI spend in real-time.
                  </p>
                </div>

                <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors reveal">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Budget Alerts</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Set hard caps and receive instant Email & In-App alerts when usage spikes, completely avoiding bill shock.
                  </p>
                </div>

                <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors reveal">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Key Management</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Secure AES-256-GCM encryption for all API keys. Monitor key health and get rotation reminders automatically.
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ─── S5: How It Works ─── */}
        <HowItWorks />

        {/* ─── S6: Supported Providers ─── */}
        <ProviderMarquee />

        {/* ─── S7: Pricing ─── */}
        <PricingSection />

        {/* ─── S8: Security Callout ─── */}
        <SecurityCallout />

        {/* ─── S8.5: FAQ ─── */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <RevealOnScroll>
              <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
            </RevealOnScroll>
            <RevealOnScroll stagger>
              <div className="space-y-4 reveal">
                {[
                  { q: "Is there a setup fee?", a: "No. You simply pay a flat subscription fee. Setup takes less than 2 minutes." },
                  { q: "Will I need to change my code?", a: "No. API Lens works by dropping in a proxy URL or syncing directly with your provider via their read-only billing endpoints." },
                  { q: "How secure is the dashboard?", a: "We use AES-256-GCM encryption with a write-only master key. We physically cannot read your stored API credentials." },
                  { q: "Can I limit spend per team member?", a: "Yes. You can issue granular gateway keys to individual developers or projects with hard budget caps." }
                ].map((faq, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                    <p className="text-white font-semibold mb-2">{faq.q}</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ─── S9: Final CTA ─── */}
        <section className="py-16 md:py-20 px-6 border-t border-zinc-800 relative xl:mb-12 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-600/5 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <RevealOnScroll>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to stop guessing<br />your AI costs?
              </h2>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-all group text-lg"
              >
                Start your 7-day free trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-zinc-500 mt-6">
                <RegionalPriceText />
              </p>
            </RevealOnScroll>
          </div>
        </section>
        </div>
      </main>

      {/* ─── S10: Footer ─── */}
      <footer className="py-12 px-6 border-t border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-sm">API Lens</span>
            <span className="text-zinc-600 text-sm ml-4">© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/security" className="hover:text-white transition">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
