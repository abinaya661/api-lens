import type { Metadata } from 'next';
import { PageHeader, SkeletonCard } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Reports',
};

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="Monthly cost reports, shareable links, and PDF exports."
      />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
