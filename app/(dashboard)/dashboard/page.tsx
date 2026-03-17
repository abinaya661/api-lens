import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared';
import { DashboardSkeleton } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of all your AI API costs across providers."
      />
      {/* TODO: Replace with real dashboard data */}
      <DashboardSkeleton />
    </div>
  );
}
