'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPrefs,
  getProfile,
  updateNotificationPrefs,
  updateProfile,
} from '@/lib/actions/settings';
import type { UpdateProfileInput } from '@/lib/validations/settings';
import type { NotificationPrefs } from '@/types/database';
import { toast } from 'sonner';

export const profileQueryKey = ['profile'] as const;
export const notificationPrefsQueryKey = ['notification-prefs'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const result = await getProfile();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const result = await updateProfile(input);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: notificationPrefsQueryKey,
    queryFn: async () => {
      const result = await getNotificationPrefs();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      const result = await updateNotificationPrefs(prefs);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationPrefsQueryKey });
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      toast.success('Notification preferences updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
