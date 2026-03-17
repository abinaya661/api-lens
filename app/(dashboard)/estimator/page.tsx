import type { Metadata } from 'next';
import { PageHeader, SkeletonCard } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Cost Estimator — Free AI API Cost Calculator',
  description: 'Compare AI API costs across OpenAI, Anthropic, Gemini, Mistral, Cohere, and more. Free, no signup required.',
};

export default function EstimatorPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cost Estimator"
        description="Compare costs across all AI providers. Free, no account required."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form skeleton */}
        <SkeletonCard />
        {/* Results table skeleton */}
        <SkeletonCard />
      </div>
    </div>
  );
}
