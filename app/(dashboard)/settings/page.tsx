'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { User, Settings2, CreditCard, Bell, KeySquare } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'billing'>('profile');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and billing information."
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Billing & Plan
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Personal Information</h3>
                  <p className="text-sm text-zinc-500">Update your photo and personal details here.</p>
                </div>
                <hr className="border-zinc-800" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">First Name</label>
                    <input type="text" defaultValue="Demo" className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-brand-500/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Last Name</label>
                    <input type="text" defaultValue="User" className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-brand-500/40" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                    <input type="email" defaultValue="demo@example.com" disabled className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed" />
                    <p className="text-xs text-zinc-500 mt-2">Email changes require re-verification.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
                    Save Changes
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
                      <h4 className="text-sm font-medium text-zinc-200">Theme</h4>
                      <p className="text-xs text-zinc-500 mt-1">Select your preferred color scheme.</p>
                    </div>
                    <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                      <option>Dark Mode (Default)</option>
                      <option>Light Mode</option>
                      <option>System Default</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200">Currency Display</h4>
                      <p className="text-xs text-zinc-500 mt-1">Base currency for dashboard displays.</p>
                    </div>
                    <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200">Email Notifications</h4>
                      <p className="text-xs text-zinc-500 mt-1">Receive daily digest of AI spend.</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600">
                      <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition" />
                    </button>
                  </div>
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
                  You are currently on the Free Trial. To upgrade your account and view billing history, you'll be redirected to our secure payment portal.
                </p>
                <button className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition">
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
