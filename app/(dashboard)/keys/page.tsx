'use client';

import { useState } from 'react';
import { PageHeader, EmptyState, ErrorState, SkeletonTable } from '@/components/shared';
import { useKeys, useAddKey, useUpdateKey, useDeleteKey } from '@/hooks/use-keys';
import { useProjects } from '@/hooks/use-projects';
import { timeAgo } from '@/lib/utils';
import type { ApiKey } from '@/types/database';
import {
  Plus,
  ShieldX,
  Trash2,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import { PROVIDER_NAMES, PROVIDER_COLORS } from '@/lib/utils/provider-config';
import { getHealthConfig } from '@/lib/utils/key-health';

export default function KeysPage() {
  const { data: keys, isLoading, error, refetch } = useKeys();
  const { data: projects } = useProjects();
  const addKeyMutation = useAddKey();
  const updateKeyMutation = useUpdateKey();
  const deleteKeyMutation = useDeleteKey();

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // Add key form state
  const [formProvider, setFormProvider] = useState('openai');
  const [formLabel, setFormLabel] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formKey, setFormKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="API Keys" description="Manage your encrypted API keys and monitor their health." />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="API Keys" description="Manage your encrypted API keys and monitor their health." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const allKeys = keys ?? [];

  if (allKeys.length === 0) {
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
        <EmptyState
          icon={<Key className="w-10 h-10" />}
          title="No API keys yet"
          description="Add your first API key to start tracking costs. Keys are encrypted with AES-256-GCM."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Key
            </button>
          }
        />
        {renderModal()}
      </div>
    );
  }

  const filteredKeys = allKeys.filter((k) => {
    if (filter === 'active') return k.is_active;
    if (filter === 'revoked') return !k.is_active;
    return true;
  });

  function handleAddKey() {
    if (!formLabel.trim() || !formKey.trim()) return;
    addKeyMutation.mutate(
      {
        provider: formProvider,
        nickname: formLabel,
        api_key: formKey,
        project_id: formProject || undefined,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setFormLabel('');
          setFormKey('');
          setFormProvider('openai');
          setFormProject('');
        },
      },
    );
  }

  function handleRevoke(id: string) {
    updateKeyMutation.mutate({ id, is_active: false });
  }

  function handleDelete(id: string) {
    deleteKeyMutation.mutate(id);
  }

  function handleCopy(id: string, hint: string) {
    navigator.clipboard.writeText(hint);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function renderModal() {
    if (!showModal) return null;
    return (
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
                onChange={(e) => setFormProvider(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              >
                {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {projects && projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project (optional)</label>
                <select
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                >
                  <option value="">No project</option>
                  {projects.filter((p) => p.is_active).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Label</label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. GPT-4o Production"
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">Keys are encrypted with AES-256-GCM before storage.</p>
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
              disabled={!formLabel.trim() || !formKey.trim() || addKeyMutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addKeyMutation.isPending ? 'Adding...' : 'Add Key'}
            </button>
          </div>
        </div>
      </div>
    );
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
            {tab} ({allKeys.filter((k) => tab === 'all' ? true : tab === 'active' ? k.is_active : !k.is_active).length})
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
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Health</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Last Synced</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredKeys.map((key) => {
                const health = getHealthConfig(key);
                const HealthIcon = health.icon;

                return (
                  <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-zinc-200">{key.nickname}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="text-xs text-zinc-500 font-mono">...{key.key_hint}</code>
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PROVIDER_COLORS[key.provider] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {PROVIDER_NAMES[key.provider] || key.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${health.bg} ${health.color}`}>
                        <HealthIcon className="w-3.5 h-3.5" />
                        {health.label}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">
                        {key.last_used ? timeAgo(key.last_used) : 'Never'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {key.is_active && (
                          <button
                            title="Revoke key"
                            onClick={() => handleRevoke(key.id)}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          >
                            <ShieldX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="Delete key"
                          onClick={() => handleDelete(key.id)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
