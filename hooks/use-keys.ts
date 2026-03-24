'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listKeys, addKey, updateKey, deleteKey } from '@/lib/actions/keys';
import type { AddKeyInput, UpdateKeyInput } from '@/lib/validations/key';
import { toast } from 'sonner';

export function useKeys() {
  return useQuery({
    queryKey: ['keys'],
    queryFn: async () => {
      const result = await listKeys();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useAddKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddKeyInput) => {
      const result = await addKey(input);
      if (result.error) throw new Error(result.error);
      return { data: result.data!, warning: result.warning };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (result.warning) {
        toast.success('API key added successfully', { description: result.warning });
      } else {
        toast.success('API key verified & added successfully');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateKeyInput) => {
      const result = await updateKey(input);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      toast.success('Key updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteKey(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Key deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
