import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, Lock, Eye, Server, CheckCircle, KeyRound, FileSearch, ArrowRight, ArrowDown,
  EyeOff, AlertTriangle, Mail, Activity,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How API Lens protects your API keys through Zero-Knowledge Architecture.',
};

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    description: 'Every API key you store is encrypted at rest using AES-256-GCM — the same algorithm used by banks and governments.',
    detail: 'Keys are encrypted before they ever touch the database. The plaintext value exists only momentarily in server memory during the encryption step, then is discarded.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security (RLS)',
    description: 'Database-enforced access policies ensure you can only ever read your own data — even at the query level.',
    detail: 'Supabase Row Level Security policies are attached directly to every table. No application logic can bypass them; the database itself rejects unauthorised reads.',
  },
  {
    icon: Server,
    title: 'HTTPS / TLS in Transit',
    description: 'All communication between your browser and our servers is encrypted in transit via TLS 1.2+.',
    detail: 'We enforce HTTPS on every endpoint and use HTTP Strict Transport Security (HSTS) headers to prevent downgrade attacks.',
  },
  {
    icon: Eye,
    title: 'No Plaintext Keys Ever Stored or Logged',
    description: 'We never write an unencrypted API key to disk, to logs, or to any external service.',
    detail: 'Server-side logging is scoped to request metadata only. API key values are stripped before any log statement is emitted. Third-party error trackers are configured to redact sensitive fields.',
  },
  {
    icon: FileSearch,
    title: 'Audit Log of Key Operations',
    description: 'Every create, view, rotate, and delete operation on an API key is recorded in a tamper-evident audit log.',
    detail: 'The log captures: the acting user, a timestamp, the action type, and the key identifier — never the key value itself. Logs are retained for 90 days.',
  },
];

const TRUST_BULLETS = [
  'Encryption keys are scoped per-account and rotated on a schedule.',
  'No third-party analytics scripts have access to your API key data.',
  'Service accounts use minimal-privilege roles.',
  'Security patches are applied within 24 hours of upstream disclosure.',
  'We do not sell or share your data with any third party.',
];

const FLOW_STEPS = [
  { label: "Your API Key", sublabel: "plaintext — never stored", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { label: "Encrypted with DEK", sublabel: "per-key Data Encryption Key", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/10" },
  { label: "DEK encrypted with Master Key", sublabel: "write-only — unreadable by anyone", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { label: "Stored in Database", sublabel: "all ciphertext, zero plaintext", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
];

export default function SecurityPage() {
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
        <div className="max-w-4xl mx-auto animate-fade-in space-y-16">
          {/* Page Header */}
          <div>
            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Security & Trust</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
              We cannot read your API keys.<br />
              <span className="text-zinc-500 font-normal text-2xl md:text-3xl">Technically. Architecturally. By design.</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
              API Lens uses a layered encryption model that makes it mathematically impossible for anyone —
              including the API Lens team — to read the credentials you store.
            </p>
          </div>

          <div className="space-y-12">
            {/* ── Section 1: Zero-Knowledge Key Architecture ── */}
            <section className="space-y-6">
              <div className="glass-card p-8 border-violet-500/20 bg-violet-500/5">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                    <EyeOff className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">The Encryption Model</h2>
                    <ul className="space-y-3 pt-2">
                      <li className="flex items-start gap-3 text-zinc-300">
                        <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                        <span>All stored credentials are encrypted with <span className="text-white font-medium">AES-256-GCM</span>, a military-grade authenticated encryption algorithm.</span>
                      </li>
                      <li className="flex items-start gap-3 text-zinc-300">
                        <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                        <span>Each key gets its own unique <span className="text-white font-medium">Data Encryption Key (DEK)</span>. Your keys never share the same encryption material.</span>
                      </li>
                      <li className="flex items-start gap-3 text-zinc-300">
                        <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                        <span>Every DEK is wrapped by a <span className="text-white font-medium">Master Encryption Key</span> stored as a write-only secret in our infrastructure.</span>
                      </li>
                      <li className="flex items-start gap-3 text-zinc-300">
                        <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                        <span>Once set, <span className="text-white font-medium">this value cannot be retrieved by anyone</span> — not via the dashboard, not via the API, not by host support.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How it works: visual flow */}
              <div className="glass-card p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">How data flows</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {FLOW_STEPS.map((step, i) => (
                    <div key={step.label} className="flex sm:flex-col items-center gap-3 flex-1">
                      <div className={`w-full rounded-xl border ${step.border} ${step.bg} p-4 text-center space-y-1`}>
                        <p className={`text-sm font-semibold ${step.color} leading-snug`}>{step.label}</p>
                        <p className="text-[11px] text-zinc-400 leading-snug">{step.sublabel}</p>
                      </div>
                      {i < FLOW_STEPS.length - 1 && <ArrowDown className="w-5 h-5 text-zinc-600 sm:hidden mx-auto my-2 shrink-0" />}
                      {i < FLOW_STEPS.length - 1 && <ArrowRight className="w-5 h-5 text-zinc-600 hidden sm:block shrink-0" aria-hidden />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 pt-2 text-center">
                  Only the final ciphertext blobs are persisted. No step writes plaintext to disk.
                </p>
              </div>
            </section>

            {/* ── Section 2: Security Features ── */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3">Additional Defence-in-Depth</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SECURITY_FEATURES.map(({ icon: Icon, title, description, detail }) => (
                  <div key={title} className="glass-card p-6 border border-zinc-800 bg-zinc-900/40">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 border border-brand-500/20 mb-4">
                      <Icon className="w-5 h-5 text-brand-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-3">{description}</p>
                    {detail && <p className="text-xs text-zinc-600 leading-relaxed pt-3 border-t border-zinc-800">{detail}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Section 3: Transparency & Auditing ── */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3">Full Transparency</h2>
              <div className="glass-card p-8 bg-blue-500/5 border-blue-500/20">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="text-zinc-300">
                          <strong className="text-white">Sync is the only reason decryption ever happens.</strong> Your credential is decrypted in memory only to call your upstream provider, never for display or export.
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="text-zinc-300">
                          <strong className="text-white">Every decryption is logged.</strong> The dashboard shows a full, immutable history of every time your keys were used for syncs.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-white transition-colors text-zinc-400 font-medium">Security</Link>
            <span className="text-zinc-600">&copy; 2026. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
