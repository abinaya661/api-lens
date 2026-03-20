'use client';

import { Header } from '@/components/layout/header';
import { useUnreadAlertCount } from '@/hooks/use-alerts';
import { useProfile } from '@/hooks/use-profile';

export function HeaderWrapper() {
  const { data: unreadCount } = useUnreadAlertCount();
  const { data: profile } = useProfile();

  const userInitial = (() => {
    const source = profile?.full_name || profile?.company_name || '';
    const alpha = source.match(/[a-zA-Z]/);
    return alpha ? alpha[0].toUpperCase() : 'U';
  })();

  return (
    <Header
      unreadAlertCount={unreadCount ?? 0}
      userInitial={userInitial}
    />
  );
}
