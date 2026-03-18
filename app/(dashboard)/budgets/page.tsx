'use client';

import { useState } from 'react';
import { PageHeader, EmptyState, ErrorState, SkeletonCard } from '@/components/shared';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils';
import type { Budget, BudgetScope } from '@/types/database';
import {
  Plus,
  Globe,
  Server,
  FolderOpen,
  Key,
  Pencil,
  Trash2,
  X,
  Wallet,
} from 'lucide-react';

const SCOPE_CONFIG: Record<BudgetScope, { icon: typeof Globe; label: string; color: string }> = {
  global: { icon: Globe, label: 'Global', color: 'bg-brand-500/10 text-brand-400' },
  platform: { icon: Server, label: 'Platform', color: 'bg-purple-500/10 text-purple-400' },
  project: { icon: FolderOpen, label: 'Project', color: 'bg-emerald-500/10 text-emerald-400' },
  key: { icon: Key, label: 'Key', color: 'bg-amber-500/10 text-amber-400' },
};

export default function BudgetsPage() {
  const { data: budgets, isLoading, error, refetch } = useBudgets();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const [formScope, setFormScope] = useState<BudgetScope>('global');
  const [formPlatform, setFormPlatform] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'weekly'>('monthly');

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Budgets" description="Set spending limits at global, platform, project, or key level." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Budgets" description="Set spending limits at global, platform, project, or key level." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const allBudgets = budgets ?? [];

  function openCreate() {
    setEditBudget(null);
    setFormScope('global');
    setFormPlatform('');
    setFormLimit('');
    setFormPeriod('monthly');
    setShowModal(true);
  }

  function openEdit(budget: Budget) {
    setEditBudget(budget);
    setFormScope(budget.scope);
    setFormPlatform(budget.platform || '');
    setFormLimit(budget.amount_usd.toString());
    setFormPeriod(budget.period as 'monthly' | 'weekly');
    setShowModal(true);
  }

  function handleSave() {
    if (!formLimit || parseFloat(formLimit) <= 0) return;
    if (editBudget) {
      updateMutation.mutate(
        { id: editBudget.id, amount_usd: parseFloat(formLimit) },
        { onSuccess: () => setShowModal(false) },
      );
    } else {
      createMutation.mutate(
        {
          scope: formScope,
          platform: formScope === 'platform' ? formPlatform : undefined,
          amount_usd: parseFloat(formLimit),
          period: formPeriod,
        },
        { onSuccess: () => setShowModal(false) },
      );
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Budgets"
        description="Set spending limits at global, platform, project, or key level."
        actions={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> Set Budget
          </button>
        }
      />

      {allBudgets.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-10 h-10" />}
          title="No budgets set"
          description="Set spending limits to get alerted when costs approach your thresholds."
          action={
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
              <Plus className="w-4 h-4" /> Set Budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allBudgets.map((budget) => {
            const scopeConfig = SCOPE_CONFIG[budget.scope];
            const ScopeIcon = scopeConfig.icon;
            const scopeLabel = budget.scope === 'global' ? 'All Providers' : budget.platform || budget.scope;

            return (
              <div key={budget.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${scopeConfig.color}`}>
                      <ScopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 capitalize">{scopeLabel}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 capitalize">{budget.scope}</span>
                        <span className="text-xs text-zinc-700">·</span>
                        <span className="text-xs text-zinc-500 capitalize">{budget.period}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(budget)} className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {formatCurrency(budget.amount_usd)}
                  </span>
                  <span className="text-xs text-zinc-500">budget limit</span>
                </div>

                <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Alerts: {[budget.alert_50 && '50%', budget.alert_75 && '75%', budget.alert_90 && '90%', budget.alert_100 && '100%'].filter(Boolean).join(', ') || 'None'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">{editBudget ? 'Edit Budget' : 'Set Budget'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Scope</label>
                <select value={formScope} onChange={(e) => setFormScope(e.target.value as BudgetScope)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all">
                  <option value="global">Global (All Providers)</option>
                  <option value="platform">Platform</option>
                  <option value="project">Project</option>
                  <option value="key">API Key</option>
                </select>
              </div>
              {formScope === 'platform' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Platform</label>
                  <input type="text" value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} placeholder="e.g. OpenAI"
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Limit (USD)</label>
                  <input type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} placeholder="2000"
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Period</label>
                  <select value={formPeriod} onChange={(e) => setFormPeriod(e.target.value as 'monthly' | 'weekly')}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all">
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formLimit || parseFloat(formLimit) <= 0}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {editBudget ? 'Save Changes' : 'Set Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
