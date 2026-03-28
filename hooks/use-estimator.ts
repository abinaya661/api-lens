'use client';

import { useQuery } from '@tanstack/react-query';
import { getCompanyForecast, getProjectForecast } from '@/lib/actions/estimator';
import { getPriceSnapshots } from '@/lib/actions/dashboard';

export function useCompanyForecast() {
  return useQuery({
    queryKey: ['estimator', 'company-forecast'],
    queryFn: async () => {
      const result = await getCompanyForecast();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useProjectForecast(projectId: string) {
  return useQuery({
    queryKey: ['estimator', 'project-forecast', projectId],
    queryFn: async () => {
      const result = await getProjectForecast(projectId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!projectId,
  });
}

export function usePriceSnapshots(category?: string, includeDeprecated: boolean = false) {
  return useQuery({
    queryKey: ['price-snapshots', category ?? 'all', includeDeprecated],
    queryFn: async () => {
      const result = await getPriceSnapshots(category, includeDeprecated);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}
