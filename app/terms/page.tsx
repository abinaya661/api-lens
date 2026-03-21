import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using API Lens.',
};

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Terms of Service</h1>
            <p className="text-zinc-500 text-sm">Last updated: March 2026</p>
          </div>

          <div className="space-y-12">
            {/* 1. Acceptance */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                1. Acceptance of Terms
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                By creating an account or using API Lens (&ldquo;the service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound
                by these Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>

            {/* 2. Service Description */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                2. Service Description
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                API Lens is a SaaS tool that helps you monitor, budget, and attribute AI API costs across
                multiple providers. The service is provided <span className="text-zinc-200 font-medium">as-is</span>. While we work hard to
                ensure reliability, we make no guarantees of uptime, accuracy of synced data, or
                uninterrupted access.
              </p>
            </section>

            {/* 3. Subscription & Billing */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                3. Subscription &amp; Billing
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>API Lens is a subscription service priced at <span className="text-zinc-200 font-medium">$5.99/month</span> after a 7-day free trial.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>You may <span className="text-zinc-200 font-medium">cancel at any time</span> from Settings &rarr; Billing. Cancellation takes effect at the end of your current billing period.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span><span className="text-zinc-200 font-medium">No refunds</span> are issued for partial billing periods already paid. If you cancel mid-cycle, you retain access until the period ends.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>Payments are processed by Dodo Payments. By subscribing, you agree to Dodo Payments&apos;s terms of service.</span>
                </li>
              </ul>
            </section>

            {/* 4. Your API Keys & Responsibilities */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                4. Your API Keys &amp; Responsibilities
              </h2>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>You are <span className="text-zinc-200 font-medium">solely responsible</span> for the API keys you add to API Lens, including ensuring you have the right to use them and that they are from legitimate sources.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>You must not add API keys that belong to other parties without their explicit consent.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-500 mt-1 shrink-0">&bull;</span>
                  <span>If a key is compromised or you suspect unauthorized access, rotate it immediately with your provider and remove it from API Lens.</span>
                </li>
              </ul>
            </section>

            {/* 5. Provider API Changes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                5. Provider API Changes
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                API Lens syncs data by calling provider APIs (OpenAI, Anthropic, etc.) on your behalf.
                We are <span className="text-zinc-200 font-medium">not responsible</span> if a provider changes, deprecates, or restricts their
                API, causing sync operations to fail or return incomplete data. We will make reasonable
                efforts to update our integrations, but cannot guarantee continuity if providers alter
                their interfaces without notice.
              </p>
            </section>

            {/* 6. Acceptable Use */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                6. Acceptable Use
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                You agree not to use API Lens to:
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-red-500 mt-1 shrink-0">&bull;</span>
                  <span>Probe, scan, or test the vulnerability of provider API systems, or attempt to circumvent rate limits or usage quotas through the service.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 mt-1 shrink-0">&bull;</span>
                  <span>Automate bulk requests to providers in a way that violates their terms of service.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 mt-1 shrink-0">&bull;</span>
                  <span>Conduct any activity that is illegal or harmful under applicable law.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 mt-1 shrink-0">&bull;</span>
                  <span>Attempt to reverse-engineer, decompile, or extract proprietary elements of the API Lens platform.</span>
                </li>
              </ul>
            </section>

            {/* 7. Account Termination */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                7. Account Termination
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                We reserve the right to suspend or permanently terminate accounts that violate these
                terms, abuse the service, or engage in fraudulent activity, with or without prior notice.
                On termination, your data will be handled in accordance with our{' '}
                <Link href="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                8. Limitation of Liability
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                To the maximum extent permitted by law, API Lens and its operators shall not be liable
                for any indirect, incidental, special, consequential, or punitive damages — including
                loss of revenue, data, or business — arising from your use of or inability to use the
                service. Our total aggregate liability shall not exceed the amount you paid us in the
                three months preceding the claim.
              </p>
            </section>

            {/* 9. Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                9. Governing Law
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of{' '}
                <span className="text-zinc-200 font-medium">India</span>. Any disputes arising from these
                Terms shall be subject to the exclusive jurisdiction of the courts located in India.
              </p>
            </section>

            {/* 10. Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                10. Changes to Terms
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                We may update these Terms from time to time. When we do, we will update the &ldquo;Last
                updated&rdquo; date at the top of this page and notify you via email if the changes are material.
                Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            {/* 11. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-zinc-800">
                11. Contact
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                For legal inquiries, email{' '}
                <a href="mailto:legal@apilens.tech" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                  legal@apilens.tech
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
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors text-zinc-400 font-medium">Terms of Service</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <span className="text-zinc-600">&copy; 2026. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
