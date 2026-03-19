import {
  Shield,
  Lock,
  Eye,
  Server,
  CheckCircle,
  KeyRound,
  FileSearch,
  ArrowRight,
  Database,
  EyeOff,
  AlertTriangle,
  Mail,
  Activity,
} from 'lucide-react';

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
    description:
      'Every API key you store is encrypted at rest using AES-256-GCM — the same algorithm used by banks and governments.',
    detail:
      'Keys are encrypted before they ever touch the database. The plaintext value exists only momentarily in server memory during the encryption step, then is discarded.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security (RLS)',
    description:
      'Database-enforced access policies ensure you can only ever read your own data — even at the query level.',
    detail:
      'Supabase Row Level Security policies are attached directly to every table. No application logic can bypass them; the database itself rejects unauthorised reads.',
  },
  {
    icon: Server,
    title: 'HTTPS / TLS in Transit',
    description:
      'All communication between your browser and our servers is encrypted in transit via TLS 1.2+.',
    detail:
      'We enforce HTTPS on every endpoint and use HTTP Strict Transport Security (HSTS) headers to prevent downgrade attacks.',
  },
  {
    icon: Eye,
    title: 'No Plaintext Keys Ever Stored or Logged',
    description:
      'We never write an unencrypted API key to disk, to logs, or to any external service.',
    detail:
      'Server-side logging is scoped to request metadata only. API key values are stripped before any log statement is emitted. Third-party error trackers are configured to redact sensitive fields.',
  },
  {
    icon: FileSearch,
    title: 'Audit Log of Key Operations',
    description:
      'Every create, view, rotate, and delete operation on an API key is recorded in a tamper-evident audit log.',
    detail:
      'The log captures: the acting user, a timestamp, the action type, and the key identifier — never the key value itself. Logs are retained for 90 days.',
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
    <div className="animate-fade-in space-y-10 max-w-3xl">

      {/* ── Section 1: Zero-Knowledge Key Architecture (Hero) ── */}
      <div className="space-y-6">
        {/* Badge + heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
            <KeyRound className="w-3.5 h-3.5" />
            Zero-Knowledge Architecture
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            We cannot read your API keys.<br />
            <span className="text-zinc-400 font-normal text-2xl">Technically. Architecturally. By design.</span>
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            API Lens uses a layered encryption model that makes it mathematically impossible for anyone —
            including the API Lens team, contractors, or the founder — to read the credentials you store.
            This is not a policy commitment. It is a hard technical constraint built into the infrastructure.
          </p>
        </div>

        {/* Hero card */}
        <div className="glass-card p-6 space-y-5 border-violet-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 mt-0.5">
              <EyeOff className="w-5 h-5 text-violet-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">How the encryption model works</h2>
              <ul className="space-y-2.5 text-sm text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  All stored credentials are encrypted with <span className="text-white font-medium">AES-256-GCM</span>, a military-grade authenticated encryption algorithm.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  Each key gets its own unique <span className="text-white font-medium">Data Encryption Key (DEK)</span>. Your keys never share the same encryption material.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  Every DEK is itself wrapped (encrypted) by a <span className="text-white font-medium">Master Encryption Key (ENCRYPTION_KEY)</span> stored as a write-only secret in Vercel&apos;s infrastructure.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  Once the master key is set in Vercel, <span className="text-white font-medium">its value cannot be retrieved by anyone</span> — not via the dashboard, not via the API, not by Vercel support.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  The only human action possible is <span className="text-white font-medium">rotation</span> — which would invalidate all existing encrypted data and require a full re-encryption pass.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How it works: visual flow */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">How it works — encryption flow</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex sm:flex-col items-center gap-2 flex-1">
                <div className={`w-full rounded-xl border ${step.border} ${step.bg} p-3 text-center space-y-1`}>
                  <p className={`text-xs font-semibold ${step.color} leading-snug`}>{step.label}</p>
                  <p className="text-[10px] text-zinc-500 leading-snug">{step.sublabel}</p>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 sm:hidden" />
                )}
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:block sm:absolute sm:translate-x-full" aria-hidden />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 pt-1">
            Only the final ciphertext blobs are persisted. No step writes plaintext to disk.
          </p>
        </div>

        {/* What this means for you */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-white">What this means for you</h3>
          </div>
          <hr className="border-zinc-800" />
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-zinc-300">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">A database breach alone is useless.</span>{' '}
                All an attacker gets is encrypted blobs — meaningless without the master key, which is never in the database.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-zinc-300">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">We cannot comply with requests to hand over your keys.</span>{' '}
                If served with a subpoena or law-enforcement order demanding your credentials, we are technically incapable of fulfilling it. We can only hand over encrypted ciphertext.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-zinc-300">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">No employee, contractor, or the founder can access your credentials.</span>{' '}
                The master key is write-only by infrastructure design. There is no admin backdoor, no support-mode bypass, and no recovery mechanism that exposes plaintext.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Section 2: Existing security features ── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            Defence-in-depth
          </div>
          <h2 className="text-xl font-bold text-white">Additional security layers</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Beyond the zero-knowledge encryption model, every layer of the stack is hardened.
          </p>
        </div>

        {SECURITY_FEATURES.map(({ icon: Icon, title, description, detail }) => (
          <div key={title} className="glass-card p-6 flex gap-5">
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

        {/* Additional trust bullets */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center border border-green-500/20">
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
      </div>

      {/* ── Section 3: Decryption Audit Trail ── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Activity className="w-3.5 h-3.5" />
            Full transparency
          </div>
          <h2 className="text-xl font-bold text-white">Decryption Audit Trail</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Credentials are only ever decrypted for one purpose: syncing your API usage data.
            Every decryption event is logged and visible to you.
          </p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 mt-0.5">
              <FileSearch className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-white font-medium">Sync is the only reason decryption ever happens.</span>{' '}
                    Your stored credential is decrypted in server memory only when a sync job needs to call your upstream API provider. It is never decrypted for display, export, or any other reason.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-white font-medium">Every decryption is logged as an immutable event.</span>{' '}
                    The log entry captures the timestamp, the key identifier, and the triggering sync job — never the key value itself.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-white font-medium">You can see exactly when your keys were accessed.</span>{' '}
                    Your dashboard shows a full history of decryption events for each credential, so you can immediately spot any unexpected access pattern.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-white font-medium">No background reads, no bulk exports, no silent access.</span>{' '}
                    If a decryption happens, it shows up in your audit trail. Full stop.
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Example audit entry</p>
                <div className="font-mono text-xs text-zinc-300 space-y-1">
                  <div className="flex gap-3">
                    <span className="text-zinc-600 w-20 shrink-0">timestamp</span>
                    <span className="text-blue-400">2026-03-19T14:32:07Z</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-zinc-600 w-20 shrink-0">action</span>
                    <span className="text-green-400">key_decrypted_for_sync</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-zinc-600 w-20 shrink-0">key_id</span>
                    <span className="text-zinc-300">key_abc123…</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-zinc-600 w-20 shrink-0">trigger</span>
                    <span className="text-zinc-300">scheduled_sync_job</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-zinc-600 w-20 shrink-0">key_value</span>
                    <span className="text-zinc-600 italic">[never logged]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Responsible Disclosure ── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Responsible disclosure
          </div>
          <h2 className="text-xl font-bold text-white">Found a security vulnerability?</h2>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Security is a collective effort. If you discover a vulnerability in API Lens — whether it is
                an encryption weakness, an authentication bypass, a data-exposure risk, or anything else —
                please report it to us privately before public disclosure. We commit to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Acknowledge your report within 48 hours
                </li>
                <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Provide a timeline for remediation
                </li>
                <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Credit you (if desired) once the issue is resolved
                </li>
                <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Never take legal action against good-faith researchers
                </li>
              </ul>
              <div className="pt-1">
                <a
                  href="mailto:security@apilens.dev"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  security@apilens.dev
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="text-xs text-zinc-600 leading-relaxed max-w-lg mx-auto">
          Security is not a feature — it is the foundation. Every architectural decision in API Lens
          is made with the assumption that any individual layer can fail, and your credentials must
          remain protected regardless.
        </p>
      </div>
    </div>
  );
}
