import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How API Lens collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-brand-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">API Lens</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm">Last updated: March 2026</p>
          </div>

          <div className="space-y-12">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                1. Introduction
              </h2>
              <div className="space-y-3 text-zinc-400 leading-relaxed">
                <p>
                  API Lens (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a SaaS tool for tracking AI API spending across
                  providers such as OpenAI, Anthropic, Google Gemini, and others. This Privacy Policy explains
                  what data we collect, how we use it, and how we protect it.
                </p>
                <p>
                  By using API Lens, you agree to the practices described in this policy. If you have any
                  questions, contact us at{' '}
                  <a href="mailto:privacy@apilens.dev" className="text-brand-400 hover:text-brand-300 transition-colors">
                    privacy@apilens.dev
                  </a>.
                </p>
              </div>
            </section>

            {/* 2. What We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                2. What We Collect
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We collect the minimum data necessary to provide the service:
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Email address</span> — required for authentication via Supabase.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Full name</span> — optional, used only for your profile display.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">API key credentials</span> — any provider API keys you choose to add. These are encrypted before storage (see Section 5).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Usage records</span> — token counts and cost data synced from provider APIs on your behalf.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Budget and alert preferences</span> — thresholds and notification settings you configure.</span>
                </li>
              </ul>
            </section>

            {/* 3. What We Do NOT Collect */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                3. What We Do NOT Collect
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-green-500 mt-1 shrink-0">&bull;</span>
                  <span>We do <span className="text-zinc-200 font-medium">not</span> collect payment card data — payments are handled entirely by Dodo Payments on their secure infrastructure.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 mt-1 shrink-0">&bull;</span>
                  <span>We do <span className="text-zinc-200 font-medium">not</span> sell your data to third parties.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 mt-1 shrink-0">&bull;</span>
                  <span>We do <span className="text-zinc-200 font-medium">not</span> use your data for advertising or marketing profiling.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 mt-1 shrink-0">&bull;</span>
                  <span>We do <span className="text-zinc-200 font-medium">not</span> train AI models on your data.</span>
                </li>
              </ul>
            </section>

            {/* 4. How We Use Your Data */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                4. How We Use Your Data
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>To provide the service — syncing usage records, rendering dashboards, and evaluating budget thresholds.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>To send transactional emails — budget alerts, key rotation reminders, and account notifications — via Resend.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>To process subscription payments via Dodo Payments.</span>
                </li>
              </ul>
            </section>

            {/* 5. Credential Encryption — PROMINENT */}
            <section className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  5. Credential Encryption &amp; Zero-Knowledge Architecture
                </h2>
              </div>

              <p className="text-zinc-300 leading-relaxed mb-6">
                This is the most important section of this policy. We want to be completely transparent about
                how your API keys are stored and protected.
              </p>

              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>All API keys you add are encrypted using <span className="text-zinc-200 font-medium">AES-256-GCM</span> before being written to the database. They are never stored in plaintext.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>Each key gets its own unique <span className="text-zinc-200 font-medium">Data Encryption Key (DEK)</span>, so a compromise of one key cannot expose others.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>The DEK itself is encrypted with a <span className="text-zinc-200 font-medium">master key</span> stored as a write-only secret in Vercel&apos;s infrastructure — it is never exposed through any API or log.</p>
                </div>

                <div className="my-2 p-4 rounded-xl bg-black/40 border border-brand-500/20">
                  <p className="text-brand-300 font-semibold text-base leading-relaxed">
                    Once set, this master key cannot be retrieved by anyone — including the API Lens founder.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>This is a <span className="text-zinc-200 font-medium">technical control, not just a policy promise</span>: we are architecturally unable to read your stored credentials. There is no admin panel, no backdoor, and no override mechanism that would allow us to see your plaintext API keys.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>Your keys are decrypted <span className="text-zinc-200 font-medium">only in memory</span> during automated sync operations, and are immediately discarded afterward. They are never logged, cached to disk, or transmitted to any third party.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                  <p>We <span className="text-zinc-200 font-medium">cannot comply</span> with requests — including legal demands — to hand over your plaintext API keys, because we genuinely cannot read them. We can confirm a key exists; we cannot reveal its value.</p>
                </div>
              </div>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                6. Data Retention
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>Your data is retained as long as your account is active.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>On account deletion, all your data — including encrypted credentials, usage records, and preferences — is <span className="text-zinc-200 font-medium">permanently deleted</span>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>Usage records older than 12 months may be archived to cold storage for billing integrity and are deleted within 90 days of account closure.</span>
                </li>
              </ul>
            </section>

            {/* 7. Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                7. Third-Party Services
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-5">
                We use the following sub-processors to deliver the service. Each operates under its own privacy
                policy and data processing terms:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Supabase',
                    role: 'Database & authentication',
                    note: 'EU / US data centers. Your data is stored in the region you select at sign-up.',
                  },
                  {
                    name: 'Dodo Payments',
                    role: 'Payment processing',
                    note: 'India-based payment gateway. Payment card data never touches our servers.',
                  },
                  {
                    name: 'Resend',
                    role: 'Transactional email',
                    note: 'Used only for alerts, rotation reminders, and account emails.',
                  },
                  {
                    name: 'Vercel',
                    role: 'Hosting & edge compute',
                    note: 'US-based infrastructure. Hosts the Next.js application and stores the master encryption key secret.',
                  },
                ].map((service) => (
                  <div key={service.name} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-white font-semibold text-sm">{service.name}</p>
                    <p className="text-brand-400 text-xs mb-2">{service.role}</p>
                    <p className="text-zinc-500 text-sm leading-relaxed">{service.note}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                8. Your Rights
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Export your data</span> at any time from the Reports page inside the dashboard.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">Delete your account</span> and all associated data from Settings &rarr; Account.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>Contact us at{' '}
                    <a href="mailto:privacy@apilens.dev" className="text-brand-400 hover:text-brand-300 transition-colors">
                      privacy@apilens.dev
                    </a>{' '}
                    for any data requests, corrections, or concerns.
                  </span>
                </li>
              </ul>
            </section>

            {/* 9. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                9. Contact
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                For privacy-related inquiries, email us at{' '}
                <a href="mailto:privacy@apilens.dev" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                  privacy@apilens.dev
                </a>
                . We aim to respond within 5 business days.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-zinc-800 bg-black">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-sm">API Lens</span>
          </Link>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition-colors text-zinc-400 font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-zinc-600">&copy; 2026. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
