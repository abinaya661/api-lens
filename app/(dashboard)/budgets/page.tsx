'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { mockBudgets, type MockBudget, type BudgetScope, type BudgetPeriod } from '@/lib/mock-data-budgets';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Globe,
  Server,
  FolderOpen,
  Key,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

const SCOPE_CONFIG: Record<BudgetScope, { icon: typeof Globe; label: string; color: string }> = {
  global: { icon: Globe, label: 'Global', color: 'bg-brand-500/10 text-brand-400' },
  platform: { icon: Server, label: 'Platform', color: 'bg-purple-500/10 text-purple-400' },
  project: { icon: FolderOpen, label: 'Project', color: 'bg-emerald-500/10 text-emerald-400' },
  key: { icon: Key, label: 'Key', color: 'bg-amber-500/10 text-amber-400' },
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<MockBudget[]>(mockBudgets);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<MockBudget | null>(null);

  // Form state
  const [formScope, setFormScope] = useState<BudgetScope>('global');
  const [formLabel, setFormLabel] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formPeriod, setFormPeriod] = useState<BudgetPeriod>('monthly');
  const [formThreshold, setFormThreshold] = useState('80');

  function openCreate() {
    setEditBudget(null);
    setFormScope('global');
    setFormLabel('');
    setFormLimit('');
    setFormPeriod('monthly');
    setFormThreshold('80');
    setShowModal(true);
  }

  function openEdit(budget: MockBudget) {
    setEditBudget(budget);
    setFormScope(budget.scope);
    setFormLabel(budget.scope_label);
    setFormLimit(budget.limit_usd.toString());
    setFormPeriod(budget.period);
    setFormThreshold(budget.threshold_pct.toString());
    setShowModal(true);
  }

  function handleSave() {
    if (!formLimit || parseFloat(formLimit) <= 0) return;

    if (editBudget) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editBudget.id
            ? { ...b, scope: formScope, scope_label: formLabel || 'All Providers', limit_usd: parseFloat(formLimit), period: formPeriod, threshold_pct: parseInt(formThreshold) }
            : b,
        ),
      );
    } else {
      const newBudget: MockBudget = {
        id: `bud_${Date.now()}`,
        scope: formScope,
        scope_label: formLabel || 'All Providers',
        limit_usd: parseFloat(formLimit),
        spent_usd: 0,
        period: formPeriod,
        threshold_pct: parseInt(formThreshold),
        created_at: new Date().toISOString(),
      };
      setBudgets((prev) => [newBudget, ...prev]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Budgets"
        description="Set spending limits at global, platform, project, or key level."
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const scopeConfig = SCOPE_CONFIG[budget.scope];
          const ScopeIcon = scopeConfig.icon;
          const percentage = Math.min((budget.spent_usd / budget.limit_usd) * 100, 100);
          const isOver = percentage >= 100;
          const isWarning = percentage >= budget.threshold_pct;

          const barColor = isOver
            ? 'bg-red-500'
            : isWarning
              ? 'bg-yellow-500'
              : 'bg-brand-500';

          return (
            <div key={budget.id} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${scopeConfig.color}`}>
                    <ScopeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{budget.scope_label}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500 capitalize">{budget.scope}</span>
                      <span className="text-xs text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500 capitalize">{budget.period}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(budget)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spend vs Limit */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {formatCurrency(budget.spent_usd)}
                  </span>
                  <span className="text-sm text-zinc-500 ml-1">
                    / {formatCurrency(budget.limit_usd)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isWarning && <AlertTriangle className={`w-3.5 h-3.5 ${isOver ? 'text-red-400' : 'text-yellow-400'}`} />}
                  <span className={`text-sm font-semibold tabular-nums ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-xs text-zinc-600 mt-2">
                Alert at {budget.threshold_pct}% · Remaining: {formatCurrency(Math.max(0, budget.limit_usd - budget.spent_usd))}
              </p>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {editBudget ? 'Edit Budget' : 'Set Budget'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Scope</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value as BudgetScope)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                >
                  <option value="global">Global (All Providers)</option>
                  <option value="platform">Platform</option>
                  <option value="project">Project</option>
                  <option value="key">API Key</option>
                </select>
              </div>

              {formScope !== 'global' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    {formScope === 'platform' ? 'Provider Name' : formScope === 'project' ? 'Project Name' : 'Key Label'}
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder={`e.g. ${formScope === 'platform' ? 'OpenAI' : formScope === 'project' ? 'Production Backend' : 'GPT-4o Production'}`}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Limit (USD)</label>
                  <input
                    type="number"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as BudgetPeriod)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Alert Threshold (%)</label>
                <input
                  type="number"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  min="50"
                  max="100"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formLimit || parseFloat(formLimit) <= 0}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editBudget ? 'Save Changes' : 'Set Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
