import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared';
import { SkeletonTable } from '@/components/shared';

export const metadata: Metadata = {
  title: 'API Keys',
};

export default function KeysPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="API Keys"
        description="Manage your encrypted API keys and monitor their health."
        actions={
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
            Add Key
          </button>
        }
      />
      <SkeletonTable rows={6} />
    </div>
  );
}
