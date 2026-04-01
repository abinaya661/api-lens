'use client';

import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  Bell,
  Clock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { PageHeader, ErrorState, SkeletonCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from '@/hooks/use-profile';
import type { NotificationPrefs } from '@/types/database';

interface NotificationPreferenceItem {
  key: keyof NotificationPrefs;
  icon: React.ElementType;
  label: string;
  description: string;
}

const NOTIFICATION_PREFS: NotificationPreferenceItem[] = [
  {
    key: 'budget_alerts_email',
    icon: AlertCircle,
    label: 'Budget Alerts',
    description: 'Receive an email when a project crosses one of its configured budget thresholds.',
  },
  {
    key: 'key_validation_failure_email',
    icon: Mail,
    label: 'Key Validation Failures',
    description: 'Get notified when an API key fails validation or billing sync.',
  },
  {
    key: 'trial_ending_reminder_email',
    icon: Clock,
    label: 'Trial Ending Reminder',
    description: 'Receive a reminder a few days before your free trial ends.',
  },
  {
    key: 'weekly_spending_report_email',
    icon: BarChart2,
    label: 'Weekly Spending Report',
    description: 'Get a weekly summary covering spend across all providers and projects.',
  },
  {
    key: 'key_rotation_reminder_email',
    icon: RefreshCw,
    label: 'Key Rotation Reminder',
    description: 'Receive periodic reminders to rotate stored API keys.',
  },
];

function Toggle({
  checked,
  id,
  onChange,
}: {
  checked: boolean;
  id: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex cursor-pointer items-center">
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="h-6 w-11 rounded-full border border-zinc-700 bg-zinc-900 transition-colors peer-checked:border-brand-500/70 peer-checked:bg-brand-600/80 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40" />
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </label>
  );
}

export default function NotificationsPage() {
  const { data, isLoading, error, refetch } = useNotificationPrefs();
  const updateMutation = useUpdateNotificationPrefs();
  const [draftPrefs, setDraftPrefs] = useState<NotificationPrefs | null>(null);

  const baseId = useId();

  useEffect(() => {
    if (data) {
      setDraftPrefs(data);
    }
  }, [data]);

  const savedPrefs = data ?? null;
  const isDirty = NOTIFICATION_PREFS.some(({ key }) => {
    if (!savedPrefs || !draftPrefs) return false;
    return Boolean(savedPrefs[key]) !== Boolean(draftPrefs[key]);
  });

  function handleChange(key: keyof NotificationPrefs, value: boolean) {
    setDraftPrefs((current) => {
      if (!current) return current;
      return { ...current, [key]: value };
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftPrefs) return;
    updateMutation.mutate(draftPrefs);
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Notification Preferences"
          description="Choose which email notifications you receive from API Lens."
        />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Notification Preferences"
          description="Choose which email notifications you receive from API Lens."
        />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!draftPrefs) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Notification Preferences"
          description="Choose which email notifications you receive from API Lens."
        />
        <ErrorState
          title="Notification preferences unavailable"
          message="Refresh the page and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notification Preferences"
        description="Choose which email notifications you receive from API Lens."
      />

      <Card className="glass-card border-zinc-800/70 bg-zinc-950/70 shadow-none">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
              <Bell className="h-4 w-4 text-brand-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Email Notifications</CardTitle>
              <CardDescription className="text-sm text-zinc-500">
                All notifications are sent to the email address on your workspace owner profile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={updateMutation.isPending} className="space-y-0 divide-y divide-zinc-800/70">
              {NOTIFICATION_PREFS.map(({ key, icon: Icon, label, description }, index) => {
                const inputId = `${baseId}-${key}`;
                return (
                  <div
                    key={key}
                    className={[
                      'flex items-start justify-between gap-4 py-4',
                      index === 0 ? 'pt-0' : '',
                      index === NOTIFICATION_PREFS.length - 1 ? 'pb-0' : '',
                    ].join(' ')}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/80 text-zinc-400">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <label htmlFor={inputId} className="cursor-pointer text-sm font-medium text-zinc-200">
                          {label}
                        </label>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          {description}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Toggle
                        id={inputId}
                        checked={Boolean(draftPrefs[key])}
                        onChange={(value) => handleChange(key, value)}
                      />
                    </div>
                  </div>
                );
              })}
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-zinc-800/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500" aria-live="polite">
                {isDirty
                  ? 'You have unsaved notification changes.'
                  : 'Notification preferences are in sync with your Supabase profile.'}
              </p>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !isDirty}
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
