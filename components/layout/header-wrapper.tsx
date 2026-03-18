'use client';

import { Header } from '@/components/layout/header';
import { useUnreadAlertCount } from '@/hooks/use-alerts';
import { useProfile } from '@/hooks/use-profile';

export function HeaderWrapper() {
  const { data: unreadCount } = useUnreadAlertCount();
  const { data: profile } = useProfile();

  const userInitial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : 'U';

  return (
    <Header
      unreadAlertCount={unreadCount ?? 0}
      userInitial={userInitial}
    />
  );
}
