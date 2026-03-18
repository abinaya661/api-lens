'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAlerts, getUnreadAlertCount, markAlertRead, markAllAlertsRead } from '@/lib/actions/alerts';
import { toast } from 'sonner';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const result = await listAlerts();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: async () => {
      const result = await getUnreadAlertCount();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    refetchInterval: 60_000, // Refresh every minute
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markAlertRead(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await markAllAlertsRead();
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('All alerts marked as read');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
