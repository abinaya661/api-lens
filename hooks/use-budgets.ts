'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBudgets, createBudget, updateBudget, deleteBudget } from '@/lib/actions/budgets';
import type { CreateBudgetInput, UpdateBudgetInput } from '@/lib/validations/budget';
import { toast } from 'sonner';

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const result = await listBudgets();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const result = await createBudget(input);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Budget created');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBudgetInput) => {
      const result = await updateBudget(input);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBudget(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Budget deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
