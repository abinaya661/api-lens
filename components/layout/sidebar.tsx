'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Key,
  DollarSign,
  Bell,
  FileText,
  Calculator,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  User,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Nav data types ───────────────────────────────────────────────────────────

type NavItem = StandaloneNavItem | NavGroup;

interface StandaloneNavItem {
  type: 'item';
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  type: 'group';
  href: string;
  label: string;
  icon: LucideIcon;
  children: { href: string; label: string; icon: LucideIcon }[];
}

// ── Nav structure ────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { type: 'item', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    type: 'group',
    href: '/projects',
    label: 'Projects',
    icon: FolderOpen,
    children: [
      { href: '/keys', label: 'API Keys', icon: Key },
      { href: '/budgets', label: 'Budgets', icon: DollarSign },
      { href: '/alerts', label: 'Alerts', icon: Bell },
      { href: '/estimator', label: 'Estimator', icon: Calculator },
    ],
  },
  { type: 'item', href: '/reports', label: 'Reports', icon: FileText },
  {
    type: 'group',
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/settings', label: 'Profile', icon: User },
      { href: '/settings/preferences', label: 'Preferences', icon: Settings2 },
      { href: '/settings/notifications', label: 'Notifications', icon: Bell },
      { href: '/settings/billing', label: 'Billing & Plan', icon: CreditCard },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRouteActive(pathname: string, href: string) {
  if (href === '/settings') {
    return pathname === '/settings';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(group: NavGroup, pathname: string) {
  if (pathname === group.href || pathname.startsWith(`${group.href}/`)) return true;
  return group.children.some((child) => isRouteActive(pathname, child.href));
}

function getInitialExpanded(pathname: string): Set<string> {
  const expanded = new Set<string>();
  for (const item of navItems) {
    if (item.type === 'group' && isGroupActive(item, pathname)) {
      expanded.add(item.href);
    }
  }
  return expanded;
}

// ── NavGroupItem ─────────────────────────────────────────────────────────────

function NavGroupItem({
  group,
  collapsed,
  expanded,
  onToggle,
  onExpand,
  pathname,
}: {
  group: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  pathname: string;
}) {
  const groupActive = isGroupActive(group, pathname);
  const selfActive = pathname === group.href && !pathname.includes('?');

  // Collapsed sidebar: render as single icon link
  if (collapsed) {
    return (
      <Link
        href={group.href}
        className={cn(
          'flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          groupActive
            ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
            : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover',
        )}
        title={group.label}
      >
        <group.icon className={cn('w-5 h-5 shrink-0', groupActive && 'text-brand-400')} />
      </Link>
    );
  }

  const groupId = `nav-group-${group.label.toLowerCase()}`;

  return (
    <div>
      {/* Group header */}
      <div
        className={cn(
          'flex items-center rounded-lg transition-all duration-200',
          selfActive
            ? 'bg-brand-600/10 border border-brand-600/20'
            : 'hover:bg-sidebar-hover',
        )}
      >
        <Link
          href={group.href}
          onClick={onExpand}
          className={cn(
            'flex items-center gap-3 flex-1 px-3 py-2.5 rounded-l-lg text-sm font-medium transition-colors duration-200',
            selfActive
              ? 'text-brand-400'
              : groupActive
                ? 'text-sidebar-text-active'
                : 'text-sidebar-text hover:text-sidebar-text-active',
          )}
        >
          <group.icon className={cn('w-5 h-5 shrink-0', (selfActive || groupActive) && (selfActive ? 'text-brand-400' : 'text-sidebar-text-active'))} />
          <span>{group.label}</span>
        </Link>
        <button
          onClick={onToggle}
          className="px-2 py-2.5 rounded-r-lg text-sidebar-text hover:text-sidebar-text-active transition-colors"
          aria-expanded={expanded}
          aria-controls={groupId}
          aria-label={expanded ? `Collapse ${group.label}` : `Expand ${group.label}`}
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* Collapsible children */}
      <div
        id={groupId}
        className="nav-group-content"
        data-expanded={expanded}
        role="group"
        aria-label={`${group.label} sub-navigation`}
      >
        <div>
          {group.children.map((child) => {
            const childActive = isRouteActive(pathname, child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-3 pl-10 pr-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                  childActive
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                    : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover',
                )}
              >
                <child.icon className={cn('w-4 h-4 shrink-0', childActive && 'text-brand-400')} />
                <span>{child.label}</span>
                {childActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => getInitialExpanded(pathname));

  // Auto-expand on route change
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      for (const item of navItems) {
        if (item.type === 'group' && isGroupActive(item, pathname)) {
          next.add(item.href);
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(groupHref: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupHref)) {
        next.delete(groupHref);
      } else {
        next.add(groupHref);
      }
      return next;
    });
  }

  function expandGroup(groupHref: string) {
    setExpandedGroups((prev) => new Set([...prev, groupHref]));
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar-bg transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-sm shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white tracking-tight">
            API Lens
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.type === 'group') {
            return (
              <NavGroupItem
                key={item.href}
                group={item}
                collapsed={collapsed}
                expanded={expandedGroups.has(item.href)}
                onToggle={() => toggleGroup(item.href)}
                onExpand={() => expandGroup(item.href)}
                pathname={pathname}
              />
            );
          }

          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                  : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-brand-400')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-zinc-500 hover:text-white transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
