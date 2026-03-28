'use client';

import { useState } from 'react';
import { BarChart3, Layers3 } from 'lucide-react';
import { DashboardSkeleton, EmptyState, ErrorState } from '@/components/shared';
import { ProviderBreakdownList } from '@/components/dashboard';
import { useCompanyForecast, useProjectForecast } from '@/hooks/use-estimator';
import { ForecastChart } from './forecast-chart';
import { ForecastMetrics } from './forecast-metrics';
import { ProjectForecastCard } from './project-forecast-card';
import { ProjectSelector } from './project-selector';

export function ForecastTab() {
  const [selectedProject, setSelectedProject] = useState('all');
  const { data, isLoading, error, refetch } = useCompanyForecast();
  const projectForecast = useProjectForecast(selectedProject === 'all' ? '' : selectedProject);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  if (!data || data.daily_data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-10 h-10" />}
        title="No usage data yet"
        description="Start using your API keys and come back to see spending forecasts."
        className="glass-card"
      />
    );
  }

  const selectedProjectData = selectedProject !== 'all'
    ? (projectForecast.data ?? data.by_project.find((project) => project.project_id === selectedProject))
    : null;

  return (
    <div className="space-y-6">
      <ForecastMetrics data={data} />

      {selectedProject === 'all' ? (
        <>
          <ForecastChart data={data.daily_data} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <ProjectSelector
                projects={data.by_project.map((project) => ({
                  project_id: project.project_id,
                  project_name: project.project_name,
                }))}
                value={selectedProject}
                onChange={setSelectedProject}
              />
            </div>
            <div>
              <ProviderBreakdownList data={data.by_provider} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.by_project.map((project) => (
              <ProjectForecastCard key={project.project_id} project={project} />
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <ProjectSelector
            projects={data.by_project.map((project) => ({
              project_id: project.project_id,
              project_name: project.project_name,
            }))}
            value={selectedProject}
            onChange={setSelectedProject}
          />

          {projectForecast.error ? (
            <ErrorState
              title="Unable to load project forecast"
              message={projectForecast.error.message}
            />
          ) : projectForecast.isLoading || !selectedProjectData ? (
            <DashboardSkeleton />
          ) : (
            <>
              <ForecastChart
                data={selectedProjectData.daily_data}
                title={`${selectedProjectData.project_name} Forecast`}
                description="Projected spend for this project based on current-month usage."
              />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProjectForecastCard project={selectedProjectData} />
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers3 className="w-4 h-4 text-zinc-500" />
                      <div>
                        <h3 className="text-base font-semibold text-zinc-100">Model Breakdown</h3>
                        <p className="text-xs text-zinc-500">Top spend by provider/model this month</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {selectedProjectData.by_model.length === 0 ? (
                        <p className="text-sm text-zinc-500">No model usage yet.</p>
                      ) : (
                        selectedProjectData.by_model.slice(0, 8).map((item) => (
                          <div key={`${item.provider}:${item.model}`} className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-zinc-200">{item.model}</p>
                              <p className="text-xs text-zinc-500 capitalize">{item.provider}</p>
                            </div>
                            <p className="text-sm font-medium text-white tabular-nums">${item.spend.toFixed(2)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <ProviderBreakdownList data={selectedProjectData.by_provider} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
