import type { Metadata } from 'next';
import { PageHeader, SkeletonCard } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Company details, billing, and account preferences."
      />
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
