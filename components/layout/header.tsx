'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          aria-label="Alerts"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
            </span>
          )}
        </Link>

        {/* User avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold hover:bg-brand-500 transition-colors"
            aria-label="User menu"
          >
            {userInitial}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-50">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="my-1 border-t border-zinc-800" />
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
