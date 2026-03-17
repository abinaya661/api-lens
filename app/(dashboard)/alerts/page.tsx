'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { mockAlerts, type MockAlert, type AlertSeverity } from '@/lib/mock-data-budgets';
import { timeAgo } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  CheckCheck,
} from 'lucide-react';

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: typeof Info; color: string; bg: string; border: string }> = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  critical: { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<MockAlert[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  function acknowledge(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
  }

  function acknowledgeAll() {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter === 'acknowledged') return a.acknowledged;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alerts"
        description="Budget thresholds, spend spikes, and key health notifications."
        actions={
          unreadCount > 0 ? (
            <button
              onClick={acknowledgeAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
        {(['all', 'unread', 'acknowledged'] as const).map((tab) => {
          const count = alerts.filter((a) => tab === 'all' ? true : tab === 'unread' ? !a.acknowledged : a.acknowledged).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filter === tab
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <Bell className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm">No alerts to show.</p>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const sev = SEVERITY_CONFIG[alert.severity];
          const SevIcon = sev.icon;

          return (
            <div
              key={alert.id}
              className={`glass-card p-5 border transition-all ${
                !alert.acknowledged ? sev.border : 'border-zinc-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${sev.bg}`}>
                  <SevIcon className={`w-5 h-5 ${sev.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-semibold ${!alert.acknowledged ? 'text-zinc-100' : 'text-zinc-400'}`}>
                        {alert.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                        title="Acknowledge"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sev.bg} ${sev.color}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-zinc-600">{timeAgo(alert.created_at)}</span>
                    {alert.scope_label && (
                      <span className="text-xs text-zinc-600">· {alert.scope_label}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
