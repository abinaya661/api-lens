'use client';

import {
  Brain,
  Code,
  Database,
  ImageIcon,
  MessageSquare,
  Video,
  Volume2,
} from 'lucide-react';
import type { UseCaseCategory } from '@/types/api';

const USE_CASES: Array<{
  id: UseCaseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'text', label: 'Text/Chat', icon: MessageSquare },
  { id: 'reasoning', label: 'Reasoning', icon: Brain },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'embedding', label: 'Embedding', icon: Database },
];

interface UseCaseSelectorProps {
  selected: UseCaseCategory;
  onSelect: (category: UseCaseCategory) => void;
}

export function UseCaseSelector({
  selected,
  onSelect,
}: UseCaseSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Use Case
        </p>
        <h3 className="text-lg font-semibold text-white mt-1">Compare Models</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {USE_CASES.map((useCase) => {
          const Icon = useCase.icon;
          const active = selected === useCase.id;

          return (
            <button
              key={useCase.id}
              type="button"
              onClick={() => onSelect(useCase.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'ring-1 ring-brand-500/30 bg-zinc-800 border-zinc-700 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {useCase.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
