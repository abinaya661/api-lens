import { Shield, Lock, Eye, Server, CheckCircle, KeyRound, FileSearch } from 'lucide-react';

// Static info page — no hooks needed.

interface SecurityFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  detail?: string;
}

const SECURITY_FEATURES: SecurityFeature[] = [
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

export default function SecurityPage() {
  return (
    <div className="animate-fade-in space-y-10 max-w-3xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Security overview
        </div>
        <h1 className="text-3xl font-bold text-white leading-tight">
          Your data is safe with API Lens
        </h1>
        <p className="text-zinc-400 leading-relaxed">
          API keys are sensitive credentials. We treat them accordingly — with defence-in-depth
          security, encryption at every layer, and a strict no-plaintext policy.
        </p>
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {SECURITY_FEATURES.map(({ icon: Icon, title, description, detail }) => (
          <div
            key={title}
            className="glass-card p-6 flex gap-5"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 border border-brand-500/20 mt-0.5">
              <Icon className="w-5 h-5 text-brand-400" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
              {detail && (
                <p className="text-xs text-zinc-500 leading-relaxed pt-1 border-t border-zinc-800/60 mt-2">
                  {detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Additional trust signals */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-base font-medium text-white">Additional commitments</h3>
        </div>
        <hr className="border-zinc-800" />
        <ul className="space-y-3">
          {TRUST_BULLETS.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-zinc-300">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-4 space-y-2">
        <p className="text-sm text-zinc-500">
          Found a security issue? Please disclose responsibly.
        </p>
        <a
          href="mailto:security@apilens.dev"
          className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors"
        >
          security@apilens.dev
        </a>
      </div>
    </div>
  );
}
