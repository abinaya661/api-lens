'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader, EmptyState, ErrorState, SkeletonTable } from '@/components/shared';
import { useKeys, useAddKey, useUpdateKey, useDeleteKey, useRefreshKeyStatus } from '@/hooks/use-keys';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { timeAgo } from '@/lib/utils';
import type { ApiKey } from '@/types/database';
import type { Provider } from '@/types/providers';
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
  Lock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { PROVIDER_NAMES, PROVIDER_COLORS, ADD_KEY_PROVIDERS } from '@/lib/utils/provider-config';
import { getHealthConfig, getTrackabilityConfig, getVerificationConfig } from '@/lib/utils/key-health';

/** Mask an API key showing only the first 2 and last 2 characters */
function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return trimmed;
  const first2 = trimmed.slice(0, 2);
  const last2 = trimmed.slice(-2);
  const middleLength = Math.min(trimmed.length - 4, 20);
  return `${first2}${'•'.repeat(middleLength)}${last2}`;
}

type ProjectMode = 'none' | 'existing' | 'new';

export default function KeysPage() {
  const { data: keys, isLoading, error, refetch } = useKeys();
  const { data: projects } = useProjects();
  const createProjectMutation = useCreateProject();
  const addKeyMutation = useAddKey();
  const updateKeyMutation = useUpdateKey();
  const deleteKeyMutation = useDeleteKey();
  const refreshKeyMutation = useRefreshKeyStatus();

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // Add key form state
  const [formProvider, setFormProvider] = useState<Provider | ''>('');
  const [formLabel, setFormLabel] = useState('');
  const [formKey, setFormKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [projectMode, setProjectMode] = useState<ProjectMode>('none');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => p.is_active),
    [projects],
  );

  function resetForm() {
    setFormProvider('');
    setFormLabel('');
    setFormKey('');
    setShowKey(false);
    setProjectMode('none');
    setSelectedProjectId('');
    setNewProjectName('');
  }

  function openModal() {
    resetForm();
    setShowModal(true);
  }

  function closeModal() {
    if (addKeyMutation.isPending) return;
    setShowModal(false);
  }

  async function handleAddKey() {
    if (!formProvider || !formLabel.trim() || !formKey.trim()) return;

    let projectId: string | undefined;

    // If user wants a new project, create it first
    if (projectMode === 'new' && newProjectName.trim()) {
      try {
        const result = await createProjectMutation.mutateAsync({
          name: newProjectName.trim(),
        });
        projectId = result.id;
      } catch {
        // Error toast is handled by the hook
        return;
      }
    } else if (projectMode === 'existing' && selectedProjectId) {
      projectId = selectedProjectId;
    }

    addKeyMutation.mutate(
      {
        provider: formProvider,
        nickname: formLabel.trim(),
        api_key: formKey,
        project_id: projectId,
      },
      {
        onSuccess: () => {
          closeModal();
          resetForm();
        },
      },
    );
  }

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

  function handleRevoke(id: string) {
    updateKeyMutation.mutate({ id, is_active: false });
  }

  function handleDelete(id: string) {
    deleteKeyMutation.mutate(id);
  }

  function handleRefresh(id: string) {
    refreshKeyMutation.mutate(id);
  }

  function handleCopy(id: string, hint: string) {
    navigator.clipboard.writeText(hint);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const isSubmitting = addKeyMutation.isPending || createProjectMutation.isPending;
  const canSubmit = formProvider && formLabel.trim() && formKey.trim() && !isSubmitting
    && (projectMode !== 'new' || newProjectName.trim())
    && (projectMode !== 'existing' || selectedProjectId);

  function renderModal() {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">Add API Key</h2>
            </div>
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="p-1 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Provider</label>
              <div className="relative">
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value as Provider)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all appearance-none"
                >
                  <option value="" disabled>Select a provider</option>
                  {ADD_KEY_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
              {formProvider === 'azure_openai' && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Azure keys should be in format: <code className="text-zinc-400">endpoint|api-key</code>
                </p>
              )}
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setProjectMode('none'); setSelectedProjectId(''); setNewProjectName(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    projectMode === 'none'
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  No Project
                </button>
                <button
                  type="button"
                  onClick={() => { setProjectMode('existing'); setNewProjectName(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    projectMode === 'existing'
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  Existing Project
                </button>
                <button
                  type="button"
                  onClick={() => { setProjectMode('new'); setSelectedProjectId(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    projectMode === 'new'
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  New Project
                </button>
              </div>

              {/* Existing project dropdown */}
              {projectMode === 'existing' && (
                <div className="mt-2.5 relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a project</option>
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  {activeProjects.length === 0 && (
                    <p className="text-xs text-zinc-500 mt-1.5">No projects found. Create a new one instead.</p>
                  )}
                </div>
              )}

              {/* New project name */}
              {projectMode === 'new' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Label */}
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

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="Paste your API key here"
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

              {/* Masked key preview + privacy message */}
              {formKey.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <code className="text-xs text-zinc-300 font-mono tracking-wider">
                      {maskApiKey(formKey)}
                    </code>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    We can never see your API keys. The moment you enter it, it is encrypted with AES-256-GCM encryption. Only the first two and last two characters are stored for identification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddKey}
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying & Adding...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Add Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allKeys.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="API Keys"
          description="Manage your encrypted API keys and monitor their health."
          actions={
            <button
              onClick={openModal}
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
              onClick={openModal}
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

  const verifiedCount = allKeys.filter((k) => k.is_valid && k.has_usage_api).length;
  const inactiveCount = allKeys.filter((k) => !k.is_valid || (!k.is_active && !!k.last_failure_reason)).length;
  const unsupportedCount = allKeys.filter((k) => !k.has_usage_api).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="API Keys"
        description="Manage your encrypted API keys and monitor their health."
        actions={
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Key
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Verified</p>
          <p className="text-2xl font-semibold text-white mt-2">{verifiedCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Keys ready for tracking</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-semibold text-white mt-2">{inactiveCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Failed validation or disabled by refresh</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Unsupported</p>
          <p className="text-2xl font-semibold text-white mt-2">{unsupportedCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Providers or keys not trackable today</p>
        </div>
      </div>

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
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Verification</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Health</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Last Checked</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredKeys.map((key) => {
                const health = getHealthConfig(key);
                const HealthIcon = health.icon;
                const verification = getVerificationConfig(key);
                const VerificationIcon = verification.icon;
                const trackability = getTrackabilityConfig(key);
                const TrackabilityIcon = trackability.icon;
                const isRefreshing = refreshKeyMutation.isPending && refreshKeyMutation.variables === key.id;

                return (
                  <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <Link
                            href={`/keys/${key.id}`}
                            className="font-medium text-zinc-200 hover:text-white transition-colors"
                          >
                            {key.nickname}
                          </Link>
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
                          {key.last_failure_reason && (
                            <p className="text-xs text-red-400 mt-1 max-w-xs truncate">{key.last_failure_reason}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PROVIDER_COLORS[key.provider] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {PROVIDER_NAMES[key.provider] || key.provider}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${trackability.bg} ${trackability.color}`}>
                          <TrackabilityIcon className="w-3.5 h-3.5" />
                          {trackability.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${verification.bg} ${verification.color}`}>
                        <VerificationIcon className="w-3.5 h-3.5" />
                        {verification.label}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${health.bg} ${health.color}`}>
                        <HealthIcon className="w-3.5 h-3.5" />
                        {health.label}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">
                        {key.last_validated ? timeAgo(key.last_validated) : 'Never'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Refresh status"
                          onClick={() => handleRefresh(key.id)}
                          disabled={isRefreshing}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
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
