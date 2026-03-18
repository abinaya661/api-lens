'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface HeaderProps {
  companyName?: string;
  lastSyncedAt?: string | null;
  unreadAlertCount?: number;
  userInitial?: string;
}

export function Header({
  companyName = 'API Lens',
  lastSyncedAt,
  unreadAlertCount = 0,
  userInitial = 'U',
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
      {/* Left: Company name (mobile) */}
      <div className="lg:hidden flex items-center gap-2">
        <span className="text-lg font-bold text-white">API Lens</span>
      </div>

      {/* Center: Search placeholder */}
      <div className="hidden lg:flex items-center flex-1 max-w-md">
        <div className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm cursor-pointer hover:border-zinc-700 transition-colors">
          <Search className="w-4 h-4" />
          <span>Search... ⌘K</span>
        </div>
      </div>

      {/* Right: Sync status + Alerts + User */}
      <div className="flex items-center gap-4">
        {lastSyncedAt && (
          <span className="hidden sm:inline text-xs text-zinc-600">
            Last synced: {timeAgo(lastSyncedAt)}
          </span>
        )}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
            </span>
          )}
        </Link>
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold hover:bg-brand-500 transition-colors"
        >
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
