'use client';

import { useState } from 'react';
import { PageHeader, EmptyState, ErrorState } from '@/components/shared';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '@/hooks/use-alerts';
import { timeAgo } from '@/lib/utils';
import type { AlertSeverity } from '@/types/database';
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
  const { data: alerts, error, refetch } = useAlerts();
  const markReadMutation = useMarkAlertRead();
  const markAllReadMutation = useMarkAllAlertsRead();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Alerts" description="Budget thresholds, spend spikes, and key health notifications." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const allAlerts = alerts ?? [];
  const unreadCount = allAlerts.filter((a) => !a.is_read).length;

  const filteredAlerts = allAlerts.filter((a) => {
    if (filter === 'unread') return !a.is_read;
    if (filter === 'read') return a.is_read;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alerts"
        description="Budget thresholds, spend spikes, and key health notifications."
        actions={
          unreadCount > 0 ? (
            <button onClick={() => markAllReadMutation.mutate()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-1 mb-6 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
        {(['all', 'unread', 'read'] as const).map((tab) => {
          const count = allAlerts.filter((a) => tab === 'all' ? true : tab === 'unread' ? !a.is_read : a.is_read).length;
          return (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filter === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {tab} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title="No alerts"
            description={filter === 'all' ? 'No alerts yet. They will appear when budget thresholds are triggered.' : `No ${filter} alerts.`}
          />
        )}

        {filteredAlerts.map((alert) => {
          const sev = SEVERITY_CONFIG[alert.severity];
          const SevIcon = sev.icon;

          return (
            <div key={alert.id} className={`glass-card p-5 border transition-all ${!alert.is_read ? sev.border : 'border-zinc-800/50 opacity-60'}`}>
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${sev.bg}`}>
                  <SevIcon className={`w-5 h-5 ${sev.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-semibold ${!alert.is_read ? 'text-zinc-100' : 'text-zinc-400'}`}>{alert.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                    {!alert.is_read && (
                      <button onClick={() => markReadMutation.mutate(alert.id)} className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sev.bg} ${sev.color}`}>{alert.severity}</span>
                    <span className="text-xs text-zinc-600">{timeAgo(alert.created_at)}</span>
                    {alert.scope_name && <span className="text-xs text-zinc-600">· {alert.scope_name}</span>}
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
