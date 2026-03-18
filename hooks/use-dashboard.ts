'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/actions/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const result = await getDashboardData();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });
}
