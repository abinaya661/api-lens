'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listKeys,
  addKey,
  updateKey,
  deleteKey,
  refreshKeyStatus,
  listManagedKeys,
  updateManagedKeyTracking,
} from '@/lib/actions/keys';
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
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Key verified and added successfully');
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

export function useRefreshKeyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await refreshKeyStatus(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      queryClient.invalidateQueries({ queryKey: ['keys', key.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (key.is_active) {
        toast.success('Key synced successfully');
        return;
      }

      toast.error('Key is inactive', {
        description: key.last_failure_reason ?? 'The provider rejected the key during sync.',
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useManagedKeys(parentKeyId: string) {
  return useQuery({
    queryKey: ['managed-keys', parentKeyId],
    queryFn: async () => {
      const result = await listManagedKeys(parentKeyId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!parentKeyId,
  });
}

export function useUpdateManagedKeyTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isTracked }: { id: string; isTracked: boolean }) => {
      const result = await updateManagedKeyTracking(id, isTracked);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (mk) => {
      queryClient.invalidateQueries({ queryKey: ['managed-keys'] });
      toast.success(mk.is_tracked ? 'Key tracking enabled' : 'Key tracking disabled');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
