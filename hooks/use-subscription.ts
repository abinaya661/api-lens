'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getSubscription,
  cancelSubscription,
} from '@/lib/actions/subscription';

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const result = await getSubscription();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await cancelSubscription();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription will cancel at the end of your billing period');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
