import type { Metadata } from 'next';
import { PageHeader, SkeletonTable } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Alerts',
};

export default function AlertsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alerts"
        description="Budget thresholds, spend spikes, and key health notifications."
      />
      <SkeletonTable rows={8} />
    </div>
  );
}
