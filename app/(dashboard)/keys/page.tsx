'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { mockApiKeys, mockProjects, type MockApiKey } from '@/lib/mock-data-projects';
import { formatCurrency, timeAgo } from '@/lib/utils';
import type { Provider } from '@/types';
import {
  Plus,
  Shield,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  Trash2,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  mistral: 'Mistral',
  cohere: 'Cohere',
  bedrock: 'Bedrock',
  azure_openai: 'Azure OpenAI',
  custom: 'Custom',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  anthropic: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gemini: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mistral: 'bg-red-500/10 text-red-400 border-red-500/20',
  cohere: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  bedrock: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  azure_openai: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  custom: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const HEALTH_CONFIG = {
  healthy: { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Healthy' },
  warning: { icon: ShieldAlert, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Warning' },
  error: { icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
};

export default function KeysPage() {
  const [keys, setKeys] = useState<MockApiKey[]>(mockApiKeys);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // Add key form state
  const [formProvider, setFormProvider] = useState<Provider>('openai');
  const [formLabel, setFormLabel] = useState('');
  const [formProject, setFormProject] = useState(mockProjects[0]?.id || '');
  const [formKey, setFormKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const filteredKeys = keys.filter((k) => {
    if (filter === 'active') return k.status === 'active';
    if (filter === 'revoked') return k.status === 'revoked' || k.status === 'expired';
    return true;
  });

  function handleAddKey() {
    if (!formLabel.trim() || !formKey.trim()) return;

    const newKey: MockApiKey = {
      id: `key_${Date.now()}`,
      project_id: formProject,
      project_name: mockProjects.find((p) => p.id === formProject)?.name || 'Unknown',
      provider: formProvider,
      label: formLabel,
      key_hint: `•••• ${formKey.slice(-4)}`,
      status: 'active',
      health: 'healthy',
      last_synced_at: null,
      total_spend: 0,
      tokens_used: 0,
      created_at: new Date().toISOString(),
      expires_at: null,
    };
    setKeys((prev) => [newKey, ...prev]);
    setShowModal(false);
    setFormLabel('');
    setFormKey('');
  }

  function handleRevoke(id: string) {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, status: 'revoked' as const, health: 'error' as const } : k,
      ),
    );
  }

  function handleCopy(id: string, hint: string) {
    navigator.clipboard.writeText(hint);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="API Keys"
        description="Manage your encrypted API keys and monitor their health."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Key
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
        {(['all', 'active', 'revoked'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
              filter === tab
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab} ({keys.filter((k) => tab === 'all' ? true : tab === 'active' ? k.status === 'active' : k.status !== 'active').length})
          </button>
        ))}
      </div>

      {/* Keys Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Key</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Provider</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Health</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Spend</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Last Synced</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredKeys.map((key) => {
                const health = HEALTH_CONFIG[key.health];
                const HealthIcon = health.icon;

                return (
                  <tr
                    key={key.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-zinc-200">{key.label}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="text-xs text-zinc-500 font-mono">{key.key_hint}</code>
                            <button
                              onClick={() => handleCopy(key.id, key.key_hint)}
                              className="text-zinc-600 hover:text-zinc-300 transition-colors"
                            >
                              {copied === key.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PROVIDER_COLORS[key.provider] || PROVIDER_COLORS.custom}`}
                      >
                        {PROVIDER_NAMES[key.provider] || key.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-xs text-zinc-400">{key.project_name}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${health.bg} ${health.color}`}>
                        <HealthIcon className="w-3.5 h-3.5" />
                        {health.label}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-zinc-200 tabular-nums">
                        {formatCurrency(key.total_spend)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">
                        {key.last_synced_at ? timeAgo(key.last_synced_at) : 'Never'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Sync now"
                          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {key.status === 'active' && (
                          <button
                            title="Revoke key"
                            onClick={() => handleRevoke(key.id)}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add API Key</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Provider</label>
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value as Provider)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                >
                  {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project</label>
                <select
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                >
                  {mockProjects.filter((p) => p.status === 'active').map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Label</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. GPT-4o Production"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value)}
                    placeholder="sk-••••••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm font-mono
                               focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">
                  🔒 Keys are encrypted with AES-256-GCM before storage.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKey}
                disabled={!formLabel.trim() || !formKey.trim()}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
