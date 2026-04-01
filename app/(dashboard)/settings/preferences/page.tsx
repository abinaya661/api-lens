'use client';

import { useEffect, useId, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
} from '@/lib/validations/settings';

const CURRENCY_LABELS: Record<(typeof SUPPORTED_CURRENCIES)[number], string> = {
  USD: 'USD ($)',
  EUR: 'EUR (EUR)',
  GBP: 'GBP (GBP)',
};

const TIMEZONE_LABELS: Record<(typeof SUPPORTED_TIMEZONES)[number], string> = {
  UTC: 'UTC',
  'America/New_York': 'Eastern Time (US)',
  'America/Chicago': 'Central Time (US)',
  'America/Denver': 'Mountain Time (US)',
  'America/Los_Angeles': 'Pacific Time (US)',
  'Europe/London': 'London',
  'Europe/Berlin': 'Berlin',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Kolkata': 'India (IST)',
};

export default function PreferencesPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [timezone, setTimezone] = useState<(typeof SUPPORTED_TIMEZONES)[number]>('UTC');
  const [currency, setCurrency] = useState<(typeof SUPPORTED_CURRENCIES)[number]>('USD');

  const currencyId = useId();
  const timezoneId = useId();

  useEffect(() => {
    if (!profile) return;

    const nextTimezone = SUPPORTED_TIMEZONES.includes(profile.timezone as (typeof SUPPORTED_TIMEZONES)[number])
      ? (profile.timezone as (typeof SUPPORTED_TIMEZONES)[number])
      : 'UTC';
    const nextCurrency = SUPPORTED_CURRENCIES.includes(profile.currency as (typeof SUPPORTED_CURRENCIES)[number])
      ? (profile.currency as (typeof SUPPORTED_CURRENCIES)[number])
      : 'USD';

    setTimezone(nextTimezone);
    setCurrency(nextCurrency);
  }, [profile]);

  const savedTimezone = SUPPORTED_TIMEZONES.includes(profile?.timezone as (typeof SUPPORTED_TIMEZONES)[number])
    ? (profile?.timezone as (typeof SUPPORTED_TIMEZONES)[number])
    : 'UTC';
  const savedCurrency = SUPPORTED_CURRENCIES.includes(profile?.currency as (typeof SUPPORTED_CURRENCIES)[number])
    ? (profile?.currency as (typeof SUPPORTED_CURRENCIES)[number])
    : 'USD';
  const isDirty = timezone !== savedTimezone || currency !== savedCurrency;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate({ timezone, currency });
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Preferences" description="Customize how API Lens looks and behaves." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Preferences" description="Customize how API Lens looks and behaves." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Preferences" description="Customize how API Lens looks and behaves." />

      <Card className="glass-card max-w-3xl border-zinc-800/70 bg-zinc-950/70 shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg text-white">Display Preferences</CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            These preferences are stored on your profile and shape dashboard totals, reports, and date grouping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={currencyId} className="text-sm font-medium text-zinc-200">
                  Currency Display
                </label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as (typeof SUPPORTED_CURRENCIES)[number])}>
                  <SelectTrigger
                    id={currencyId}
                    aria-describedby={`${currencyId}-description`}
                    className="border-zinc-800 bg-zinc-900/80 text-zinc-100"
                  >
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                    {SUPPORTED_CURRENCIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {CURRENCY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id={`${currencyId}-description`} className="text-xs text-zinc-500">
                  Use this currency when displaying dashboard totals and budget summaries.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={timezoneId} className="text-sm font-medium text-zinc-200">
                  Timezone
                </label>
                <Select value={timezone} onValueChange={(value) => setTimezone(value as (typeof SUPPORTED_TIMEZONES)[number])}>
                  <SelectTrigger
                    id={timezoneId}
                    aria-describedby={`${timezoneId}-description`}
                    className="border-zinc-800 bg-zinc-900/80 text-zinc-100"
                  >
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                    {SUPPORTED_TIMEZONES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {TIMEZONE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id={`${timezoneId}-description`} className="text-xs text-zinc-500">
                  Forecasts, daily buckets, and report timestamps follow this timezone.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-800/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Preference changes are saved to the profile row backing your workspace owner account.
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
