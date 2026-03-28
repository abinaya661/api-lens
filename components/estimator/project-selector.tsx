'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectSelectorProps {
  projects: Array<{ project_id: string; project_name: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSelector({
  projects,
  value,
  onChange,
}: ProjectSelectorProps) {
  return (
    <div className="glass-card p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Project View
        </p>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.project_id} value={project.project_id}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
