'use client';

import { useState, useEffect } from 'react';
import { PageHeader, ErrorState, SkeletonCard } from '@/components/shared';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

export default function SettingsPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
    }
  }, [profile]);

  function handleSave() {
    updateMutation.mutate({
      full_name: fullName || undefined,
      company_name: companyName || null,
    });
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Profile" description="Manage your personal information." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Profile" description="Manage your personal information." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Profile" description="Manage your personal information." />

      <div className="glass-card p-6 space-y-6 max-w-3xl">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Personal Information</h3>
          <p className="text-sm text-zinc-500">Update your personal details here.</p>
        </div>
        <hr className="border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-brand-500/40" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-brand-500/40" />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
