import type { Metadata } from 'next';
import { PageHeader, SkeletonCard } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Budgets',
};

export default function BudgetsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Budgets"
        description="Set spending limits at global, platform, project, or key level."
        actions={
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
            Set Budget
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
