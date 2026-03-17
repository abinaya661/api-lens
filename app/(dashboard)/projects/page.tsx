'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { mockProjects, type MockProject } from '@/lib/mock-data-projects';
import { formatCurrency, timeAgo } from '@/lib/utils';
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Archive,
  Pencil,
  Trash2,
  Key,
  X,
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<MockProject[]>(mockProjects);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<MockProject | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  function openCreate() {
    setEditProject(null);
    setFormName('');
    setFormDesc('');
    setShowModal(true);
  }

  function openEdit(project: MockProject) {
    setEditProject(project);
    setFormName(project.name);
    setFormDesc(project.description || '');
    setShowModal(true);
    setMenuOpen(null);
  }

  function handleSave() {
    if (!formName.trim()) return;

    if (editProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editProject.id
            ? { ...p, name: formName, description: formDesc || null, slug: formName.toLowerCase().replace(/\s+/g, '-') }
            : p,
        ),
      );
    } else {
      const newProject: MockProject = {
        id: `proj_${Date.now()}`,
        name: formName,
        slug: formName.toLowerCase().replace(/\s+/g, '-'),
        description: formDesc || null,
        created_at: new Date().toISOString(),
        key_count: 0,
        total_spend: 0,
        status: 'active',
      };
      setProjects((prev) => [newProject, ...prev]);
    }
    setShowModal(false);
  }

  function handleArchive(id: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'archived' ? 'active' : 'archived' }
          : p,
      ),
    );
    setMenuOpen(null);
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setMenuOpen(null);
  }

  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description="Organize API keys by project for cost attribution."
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        }
      />

      {/* Active Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className="glass-card p-5 flex flex-col gap-4 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-600/10 text-brand-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{project.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{project.slug}</p>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen === project.id && (
                  <div className="absolute right-0 top-8 z-50 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 animate-fade-in">
                    <button
                      onClick={() => openEdit(project)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleArchive(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {project.description && (
              <p className="text-xs text-zinc-500 line-clamp-2">{project.description}</p>
            )}

            <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Key className="w-3 h-3" />
                <span>{project.key_count} keys</span>
              </div>
              <span className="text-sm font-semibold text-zinc-200 tabular-nums">
                {formatCurrency(project.total_spend)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Archived ({archivedProjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="glass-card p-5 opacity-50 hover:opacity-80 transition-opacity relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-zinc-500">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400">{project.name}</h3>
                      <p className="text-xs text-zinc-600 mt-0.5">{timeAgo(project.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchive(project.id)}
                    className="text-xs text-brand-400 hover:text-brand-300 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Restore
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                  <span className="text-xs text-zinc-600">{project.key_count} keys</span>
                  <span className="text-sm font-semibold text-zinc-500 tabular-nums">
                    {formatCurrency(project.total_spend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {editProject ? 'Edit Project' : 'Create Project'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Production Backend"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What is this project used for?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm resize-none
                             focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
