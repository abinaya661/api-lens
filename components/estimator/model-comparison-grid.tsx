'use client';

import { Calculator } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { ModelCard, type ModelComparisonResult } from './model-card';

interface ModelComparisonGridProps {
  models: ModelComparisonResult[];
  onTogglePin: (modelId: string) => void;
}

export function ModelComparisonGrid({
  models,
  onTogglePin,
}: ModelComparisonGridProps) {
  if (models.length === 0) {
    return (
      <EmptyState
        icon={<Calculator className="w-10 h-10" />}
        title="No matching models"
        description="Adjust the provider filter or include deprecated models to widen the comparison set."
        className="glass-card"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} onTogglePin={onTogglePin} />
      ))}
    </div>
  );
}
