import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared';
import { SkeletonTable } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Projects',
};

export default function ProjectsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description="Organize API keys by project for cost attribution."
        actions={
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
            New Project
          </button>
        }
      />
      <SkeletonTable rows={6} />
    </div>
  );
}
