'use client';

import { useState, useEffect } from 'react';
import { PageHeader, ErrorState, SkeletonCard } from '@/components/shared';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

export default function PreferencesPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');

  useEffect(() => {
    if (profile) {
      setTimezone(profile.timezone || 'UTC');
      setCurrency((profile.currency as 'USD' | 'EUR' | 'GBP') || 'USD');
    }
  }, [profile]);

  function handleSave() {
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

      <div className="glass-card p-6 space-y-6 max-w-3xl">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Application Preferences</h3>
          <p className="text-sm text-zinc-500">Customize how API Lens looks and behaves.</p>
        </div>
        <hr className="border-zinc-800" />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Currency Display</h4>
              <p className="text-xs text-zinc-500 mt-1">Base currency for dashboard displays.</p>
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Timezone</h4>
              <p className="text-xs text-zinc-500 mt-1">Used for date groupings in reports.</p>
            </div>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="America/Chicago">Central (US)</option>
              <option value="America/Denver">Mountain (US)</option>
              <option value="America/Los_Angeles">Pacific (US)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
