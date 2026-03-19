'use client';

// TODO - wire toggles to user_preferences table in future.

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, Mail, AlertCircle, Clock, BarChart2, RefreshCw, Save } from 'lucide-react';
import { PageHeader } from '@/components/shared';

interface NotificationPref {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const NOTIFICATION_PREFS: NotificationPref[] = [
  {
    key: 'budget_alerts_email',
    icon: AlertCircle,
    label: 'Budget alerts',
    description: 'Receive an email when a project crosses its budget threshold.',
  },
  {
    key: 'key_validation_failure_email',
    icon: Mail,
    label: 'Key validation failures',
    description: 'Get notified by email when an API key fails validation.',
  },
  {
    key: 'trial_ending_reminder_email',
    icon: Clock,
    label: 'Trial ending reminder',
    description: 'Reminder email a few days before your free trial expires.',
  },
  {
    key: 'weekly_spending_report_email',
    icon: BarChart2,
    label: 'Weekly spending report',
    description: 'A weekly summary of your API spending across all projects.',
  },
  {
    key: 'key_rotation_reminder_email',
    icon: RefreshCw,
    label: 'Key rotation reminder',
    description: 'Periodic reminder to rotate your API keys for better security.',
  },
];

type PrefsState = Record<string, boolean>;

const DEFAULT_PREFS: PrefsState = {
  budget_alerts_email: true,
  key_validation_failure_email: true,
  trial_ending_reminder_email: true,
  weekly_spending_report_email: false,
  key_rotation_reminder_email: false,
};

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className="w-10 h-5.5 rounded-full border transition-colors
                   bg-zinc-700 border-zinc-600
                   peer-checked:bg-brand-600 peer-checked:border-brand-600
                   peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40"
        style={{ height: '1.375rem', width: '2.5rem' }}
      >
        <div
          className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
                      ${checked ? 'translate-x-[1.125rem]' : 'translate-x-0'}`}
        />
      </div>
    </label>
  );
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  function setKey(key: string, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    // Simulate async save (wired to DB in future)
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    toast.success('Notification preferences saved.');
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notification Preferences"
        description="Choose which email notifications you receive from API Lens."
      />

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-brand-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">Email notifications</h3>
            <p className="text-xs text-zinc-500 mt-0.5">All notifications are sent to your account email.</p>
          </div>
        </div>

        <hr className="border-zinc-800" />

        <div className="space-y-0 divide-y divide-zinc-800/60">
          {NOTIFICATION_PREFS.map(({ key, icon: Icon, label, description }) => (
            <div key={key} className="flex items-center justify-between py-4 gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-zinc-800/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
              </div>
              <div className="shrink-0">
                <Toggle
                  id={key}
                  checked={!!prefs[key]}
                  onChange={(v) => setKey(key, v)}
                />
              </div>
            </div>
          ))}
        </div>

        <hr className="border-zinc-800" />

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium
                       hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
