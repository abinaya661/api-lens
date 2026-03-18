'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getSubscription,
  createSubscription,
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

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      razorpaySubscriptionId,
      razorpayCustomerId,
      plan,
    }: {
      razorpaySubscriptionId: string;
      razorpayCustomerId: string;
      plan: 'monthly' | 'annual';
    }) => {
      const result = await createSubscription(
        razorpaySubscriptionId,
        razorpayCustomerId,
        plan
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription activated!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
