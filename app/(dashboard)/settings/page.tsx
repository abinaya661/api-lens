'use client';

import { useState, useEffect } from 'react';
import { PageHeader, ErrorState, SkeletonCard } from '@/components/shared';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { User, Settings2, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'billing'>('profile');

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setTimezone(profile.timezone || 'UTC');
      setCurrency((profile.currency as 'USD' | 'EUR' | 'GBP') || 'USD');
    }
  }, [profile]);

  function handleSaveProfile() {
    updateMutation.mutate({
      full_name: fullName || undefined,
      company_name: companyName || null,
    });
  }

  function handleSavePreferences() {
    updateMutation.mutate({ timezone, currency });
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Settings" description="Manage your account, preferences, and billing information." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Settings" description="Manage your account, preferences, and billing information." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" description="Manage your account, preferences, and billing information." />

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            {([
              { key: 'profile' as const, icon: User, label: 'Profile' },
              { key: 'preferences' as const, icon: Settings2, label: 'Preferences' },
              { key: 'billing' as const, icon: CreditCard, label: 'Billing & Plan' },
            ]).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6 space-y-6">
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
                  <button onClick={handleSaveProfile} disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6 space-y-6">
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
                  <button onClick={handleSavePreferences} disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                    {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6 text-center py-16">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/50">
                  <CreditCard className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Billing & Subscription</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                  You are currently on the Free Trial. Razorpay billing integration coming in Phase 4.
                </p>
                <button className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition" disabled>
                  Manage Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
