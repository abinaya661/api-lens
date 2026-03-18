import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-brand-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">API Lens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              Now tracking over $1M in AI spend weekly
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
              Stop guessing your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                AI token costs.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              API Lens is the single dashboard to monitor, budget, and attribute AI API usage across OpenAI, Anthropic, Gemini, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
              >
                Start your 7-day free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium hover:bg-zinc-800 transition-all flex items-center justify-center"
              >
                View Live Demo
              </Link>
            </div>
            <p className="text-sm text-zinc-500 mt-6">
              $5.99/month after trial. Cancel anytime.
            </p>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-20 px-6 bg-zinc-900/30 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Unified Dashboard</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Connect all your providers and see exactly which projects and models are driving your AI spend in real-time.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Budget Alerts</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Set hard caps and receive instant Slack/Email alerts when usage spikes, completely avoiding bill shock.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Key Management</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Secure AES-256-GCM encryption for all API keys. Monitor key health and get rotation reminders automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Screenshot Mockup */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-black rounded-t-xl">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="aspect-[16/9] bg-black opacity-80 rounded-b-xl flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
                <div className="text-center">
                  <p className="text-zinc-500 mb-4 font-mono text-sm">Interactive Dashboard Preview</p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors shadow-lg"
                  >
                    Open Live Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
            <Link href="#" className="hover:text-white transition">Privacy</Link>
            <Link href="#" className="hover:text-white transition">Terms</Link>
            <Link href="https://github.com/abinaya661/api-lens" className="hover:text-white transition">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
