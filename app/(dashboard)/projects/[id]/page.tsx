'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '@/lib/actions/projects';
import { listBudgets } from '@/lib/actions/budgets';
import { useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useKeys } from '@/hooks/use-keys';
import { SkeletonCard, ErrorState } from '@/components/shared';
import { timeAgo, formatCurrency } from '@/lib/utils';
import type { ApiKey } from '@/types/database';
import {
  ArrowLeft,
  FolderOpen,
  Key,
  Trash2,
  Edit2,
  X,
  Shield,
  ShieldX,
  CheckCircle,
  AlertTriangle,
  Archive,
} from 'lucide-react';

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  mistral: 'Mistral',
  cohere: 'Cohere',
  bedrock: 'Bedrock',
  azure_openai: 'Azure OpenAI',
  elevenlabs: 'ElevenLabs',
  deepgram: 'Deepgram',
  assemblyai: 'AssemblyAI',
  replicate: 'Replicate',
  fal: 'Fal AI',
  openrouter: 'OpenRouter',
  vertex_ai: 'Vertex AI',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  anthropic: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gemini: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mistral: 'bg-red-500/10 text-red-400 border-red-500/20',
  cohere: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  bedrock: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  azure_openai: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  elevenlabs: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  deepgram: 'bg-green-500/10 text-green-400 border-green-500/20',
  assemblyai: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  replicate: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  fal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  openrouter: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  vertex_ai: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function KeyHealthBadge({ apiKey }: { apiKey: ApiKey }) {
  if (!apiKey.is_active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
        <ShieldX className="w-3 h-3" />
        Inactive
      </span>
    );
  }
  if (apiKey.consecutive_failures > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <AlertTriangle className="w-3 h-3" />
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
      <CheckCircle className="w-3 h-3" />
      Active
    </span>
  );
}

const PROJECT_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#ea580c', '#65a30d',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#4f46e5');

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const result = await getProject(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });

  // Fetch all keys and filter by project_id
  // Note: since project_id is not on the ApiKey type directly, we check via project_keys join
  // The keys list action returns api_keys, so we rely on what's available
  const { data: allKeys } = useKeys();

  // Fetch budgets to find project-scoped budget
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

  if (error || !project) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <ErrorState
          message={error instanceof Error ? error.message : 'Project not found'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Project-scoped budget
  const projectBudget = budgets?.find((b) => b.scope === 'project' && b.scope_id === id);

  // Keys for this project — because project_id isn't on ApiKey directly,
  // we cannot filter client-side perfectly without a join. We show all keys
  // as a fallback when no project_id field is present on the ApiKey type.
  // If the database returns project_id on the key row (via join), it would be used here.
  const projectKeys = (allKeys ?? []).filter((k) => {
    return (k as ApiKey & { project_id?: string }).project_id === id;
  });

  function openEditModal() {
    setEditName(project!.name);
    setEditDesc(project!.description || '');
    setEditColor(project!.color || '#4f46e5');
    setShowEditModal(true);
  }

  function handleEdit() {
    updateMutation.mutate(
      { id, name: editName, description: editDesc || null, color: editColor },
      {
        onSuccess: () => {
          setShowEditModal(false);
          refetch();
        },
      },
    );
  }

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push('/projects');
      },
    });
  }

  function handleArchiveToggle() {
    if (!project) return;
    updateMutation.mutate(
      { id, is_active: !project.is_active },
      { onSuccess: () => refetch() },
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Projects
      </Link>

      {/* Header card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{project.name}</h1>
                {!project.is_active && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-700">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-zinc-400 mt-1">{project.description}</p>
              )}
              <p className="text-xs text-zinc-600 mt-1.5">Created {timeAgo(project.created_at)}</p>
            </div>
          </div>

          {/* Color swatch + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-5 h-5 rounded-full border border-white/10"
              style={{ backgroundColor: project.color }}
              title={`Color: ${project.color}`}
            />
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

      {/* Budget bar (if project budget exists) */}
      {projectBudget && (
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Budget</h2>
            <span className="text-xs text-zinc-500 capitalize">{projectBudget.period}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Spend vs. Limit</span>
            <span className="text-xs font-medium text-zinc-300">
              {formatCurrency(projectBudget.amount_usd)} limit
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: '0%' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-600">Usage data synced via provider API</span>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {projectBudget.alert_50 && <span>50% alert on</span>}
              {projectBudget.alert_90 && <span>90% alert on</span>}
            </div>
          </div>
        </div>
      )}

      {/* Assigned API keys */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Assigned API Keys
          </h2>
          <span className="text-xs text-zinc-500">
            {projectKeys.length} {projectKeys.length === 1 ? 'key' : 'keys'}
          </span>
        </div>

        {projectKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 mb-3">
              <Key className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No keys assigned to this project yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Assign keys from the{' '}
              <Link href="/keys" className="text-brand-400 hover:text-brand-300 transition-colors">
                Keys page
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectKeys.map((k) => (
              <Link
                key={k.id}
                href={`/keys/${k.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{k.nickname}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${PROVIDER_COLORS[k.provider] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}
                      >
                        {PROVIDER_NAMES[k.provider] || k.provider}
                      </span>
                      <code className="text-xs text-zinc-600 font-mono">...{k.key_hint}</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <KeyHealthBadge apiKey={k} />
                  {k.last_used && (
                    <span className="text-xs text-zinc-600 hidden sm:block">
                      {timeAgo(k.last_used)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Project metadata */}
      <div className="glass-card p-6 mb-4 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Project ID</span>
            <code className="text-xs text-zinc-400 font-mono break-all">{project.id}</code>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Status</span>
            <span className={`text-sm font-medium ${project.is_active ? 'text-green-400' : 'text-zinc-500'}`}>
              {project.is_active ? 'Active' : 'Archived'}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Created</span>
            <span className="text-sm text-zinc-200">
              {new Date(project.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Last Updated</span>
            <span className="text-sm text-zinc-200">{timeAgo(project.updated_at)}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Color</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-white/10"
                style={{ backgroundColor: project.color }}
              />
              <code className="text-sm text-zinc-400 font-mono">{project.color}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 border border-red-500/10">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-zinc-500 mb-4">
          These actions are destructive. Deleting a project removes all project associations.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleArchiveToggle}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            {project.is_active ? 'Archive Project' : 'Restore Project'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Project
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Edit Project</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Production Backend"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="What is this project used for?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: editColor === color ? 'white' : 'transparent',
                        boxShadow: editColor === color ? `0 0 0 2px ${color}40` : 'none',
                      }}
                    />
                  ))}
                </div>
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
                disabled={!editName.trim() || updateMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                <h2 className="text-base font-semibold text-white">Delete Project</h2>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">{project.name}</span>? All key associations
              will be removed.
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
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
