'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getKey } from '@/lib/actions/keys';
import { listBudgets } from '@/lib/actions/budgets';
import { useUpdateKey, useDeleteKey, useRefreshKeyStatus, useManagedKeys, useUpdateManagedKeyTracking } from '@/hooks/use-keys';
import { useProjects } from '@/hooks/use-projects';
import { SkeletonCard, ErrorState } from '@/components/shared';
import { timeAgo, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Key,
  Shield,
  Clock,
  Trash2,
  Edit2,
  XCircle,
  X,
  RefreshCw,
  Loader2,
  Users,
} from 'lucide-react';
import { PROVIDER_NAMES, PROVIDER_COLORS } from '@/lib/utils/provider-config';
import { getHealthConfig } from '@/lib/utils/key-health';

export default function KeyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const updateKeyMutation = useUpdateKey();
  const deleteKeyMutation = useDeleteKey();
  const refreshMutation = useRefreshKeyStatus();
  const trackingMutation = useUpdateManagedKeyTracking();
  useProjects();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const {
    data: apiKey,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['keys', id],
    queryFn: async () => {
      const result = await getKey(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });

  // Fetch managed keys for admin keys
  const { data: managedKeys } = useManagedKeys(id);

  // Fetch budgets to find any key-scoped budget
  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const result = await listBudgets();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-6 w-40 rounded bg-zinc-800 animate-pulse" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <Link
          href="/keys"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Keys
        </Link>
        <ErrorState
          message={error instanceof Error ? error.message : 'Key not found'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const health = getHealthConfig(apiKey);
  const HealthIcon = health.icon;
  const providerLabel = PROVIDER_NAMES[apiKey.provider] || apiKey.provider;
  const providerColor =
    PROVIDER_COLORS[apiKey.provider] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  // Find any key-scoped budget assigned to this key.
  const keyBudget = budgets?.find((b) => b.scope === 'key' && b.scope_id === id);

  function openEditModal() {
    setEditNickname(apiKey!.nickname);
    setEditNotes(apiKey!.notes || '');
    setShowEditModal(true);
  }

  function handleEdit() {
    updateKeyMutation.mutate(
      { id, nickname: editNickname, notes: editNotes || undefined },
      {
        onSuccess: () => {
          setShowEditModal(false);
          refetch();
        },
      },
    );
  }

  function handleDelete() {
    deleteKeyMutation.mutate(id, {
      onSuccess: () => {
        router.push('/keys');
      },
    });
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/keys"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Keys
      </Link>

      {/* Header card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600/10 text-brand-400 shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{apiKey.nickname}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${providerColor}`}
                >
                  {providerLabel}
                </span>
                <code className="text-xs text-zinc-500 font-mono bg-zinc-800/60 px-2 py-0.5 rounded">
                  ...{apiKey.key_hint}
                </code>
                {apiKey.key_type === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Admin
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${health.bg} ${health.color}`}
                >
                  <HealthIcon className="w-3.5 h-3.5" />
                  {health.label}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {apiKey.is_active && (
              <button
                onClick={() => refreshMutation.mutate(id)}
                disabled={refreshMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600/10 text-brand-400 border border-brand-500/20 hover:bg-brand-600/20 transition-colors disabled:opacity-50"
              >
                {refreshMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {refreshMutation.isPending ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Created */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 mt-2">
            {new Date(apiKey.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{timeAgo(apiKey.created_at)}</p>
        </div>

        {/* Last used */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Synced</span>
          </div>
          <p className="text-sm font-medium text-zinc-200 mt-2">
            {apiKey.last_synced_at
              ? new Date(apiKey.last_synced_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Never synced'}
          </p>
          {apiKey.last_synced_at && (
            <p className="text-xs text-zinc-500 mt-0.5">{timeAgo(apiKey.last_synced_at)}</p>
          )}
        </div>
      </div>

      {/* Key details card */}
      <div className="glass-card p-6 mb-4 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Key Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Provider</span>
            <span className="text-sm text-zinc-200">{providerLabel}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Key Hint</span>
            <code className="text-sm text-zinc-200 font-mono">...{apiKey.key_hint}</code>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Status</span>
            <span className={`text-sm font-medium ${health.color}`}>{health.label}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Consecutive Failures</span>
            <span
              className={`text-sm font-medium ${apiKey.consecutive_failures > 0 ? 'text-yellow-400' : 'text-zinc-200'}`}
            >
              {apiKey.consecutive_failures}
            </span>
          </div>
          {apiKey.rotation_due && (
            <div>
              <span className="text-xs text-zinc-500 block mb-1">Rotation Due</span>
              <span className="text-sm text-zinc-200">
                {new Date(apiKey.rotation_due).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {apiKey.last_validated && (
            <div>
              <span className="text-xs text-zinc-500 block mb-1">Last Validated</span>
              <span className="text-sm text-zinc-200">{timeAgo(apiKey.last_validated)}</span>
            </div>
          )}
          {apiKey.endpoint_url && (
            <div className="sm:col-span-2">
              <span className="text-xs text-zinc-500 block mb-1">Custom Endpoint</span>
              <code className="text-sm text-zinc-300 font-mono break-all">{apiKey.endpoint_url}</code>
            </div>
          )}
          {apiKey.notes && (
            <div className="sm:col-span-2">
              <span className="text-xs text-zinc-500 block mb-1">Notes</span>
              <p className="text-sm text-zinc-300">{apiKey.notes}</p>
            </div>
          )}
          {apiKey.last_failure_reason && (
            <div className="sm:col-span-2">
              <span className="text-xs text-zinc-500 block mb-1">Last Failure Reason</span>
              <p className="text-sm text-red-400">{apiKey.last_failure_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget info (if key-scoped budget exists) */}
      {keyBudget && (
        <div className="glass-card p-6 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Budget</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 capitalize">{keyBudget.period} budget</span>
            <span className="text-xs text-zinc-400">
              {formatCurrency(keyBudget.amount_usd)} limit
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: '0%' }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-2">Usage data synced via provider API.</p>
        </div>
      )}

      {/* Managed / Tracked keys (admin keys only) */}
      {apiKey.key_type === 'admin' && (
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Tracked Keys
              </h2>
              {managedKeys && managedKeys.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400">
                  {managedKeys.length}
                </span>
              )}
            </div>
          </div>

          {!managedKeys || managedKeys.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No child keys discovered yet.</p>
              <p className="text-xs text-zinc-600 mt-1">
                Keys are discovered automatically every 6 hours, or click Sync Now above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Project</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Key</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Last Used</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tracked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {managedKeys.map((mk) => (
                    <tr key={mk.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="text-sm text-zinc-200">{mk.remote_key_name || 'Unnamed'}</span>
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-500">{mk.remote_project_name || '-'}</span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <code className="text-xs text-zinc-600 font-mono">{mk.redacted_value || '-'}</code>
                      </td>
                      <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                        <span className="text-xs text-zinc-500">
                          {mk.last_used_at ? timeAgo(mk.last_used_at) : 'Never'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => trackingMutation.mutate({ id: mk.id, isTracked: !mk.is_tracked })}
                          disabled={trackingMutation.isPending}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                            mk.is_tracked ? 'bg-brand-600' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              mk.is_tracked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Danger zone */}
      <div className="glass-card p-6 border border-red-500/10">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Deleting this key removes all associated data and cannot be undone.
        </p>
        <div className="flex gap-3">
          {apiKey.is_active && (
            <button
              onClick={() => updateKeyMutation.mutate({ id, is_active: false })}
              disabled={updateKeyMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Deactivate Key
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Key
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Edit API Key</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Label / Nickname</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="e.g. GPT-4o Production"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Notes (optional)</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any notes about this key..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editNickname.trim() || updateKeyMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateKeyMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Delete API Key</h2>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">{apiKey.nickname}</span>? All associated usage
              data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteKeyMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteKeyMutation.isPending ? 'Deleting...' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
