# Skill 04 — Frontend Architecture & Component Design
# Expert: FEX — Frontend Expert

The difference between a product that feels fast and professional and
one that feels janky comes down to three things: loading states,
empty states, and design system consistency. Users forgive bugs.
They do not forgive interfaces that feel unpolished.

---

## Why shadcn/ui

Most libraries (MUI, Chakra) give you components you import from a package.
You cannot change their internals. When you need a Button that behaves
slightly differently, you fight the library.

shadcn/ui: you copy component source code directly into your project.
Built on Radix UI primitives (accessibility, keyboard navigation, ARIA).
Styled with Tailwind. You own the code completely.
Customisation is editing a file — not fighting a library.

---

## Design Token System

// /styles/globals.css
// CSS variables instead of hardcoded Tailwind colour names.
// To change brand colour: change one line here, not 200 component files.
// CSS variables adapt to dark mode with @media — no dark: prefix needed.
@layer base {
  :root {
    --bg-base:        #09111f;
    --bg-card:        #0c1a2e;
    --bg-sidebar:     #060d18;
    --bg-elevated:    #0f2040;
    --border:         #1e3a5f;
    --border-subtle:  #152a45;
    --brand:          #4f46e5;
    --brand-hover:    #4338ca;
    --success:        #10b981;
    --danger:         #ef4444;
    --warning:        #f59e0b;
    --text-primary:   #e2e8f0;
    --text-secondary: #94a3b8;
    --text-muted:     #4a6380;
  }
}

---

## Loading Skeleton Pattern

// /components/app/shared/loading-skeleton.tsx
// Skeletons affect perceived performance directly.
// "Something is happening" feels faster than "nothing then everything".
// CSS animations (animate-pulse) run on the GPU compositor thread —
// they do not block the JavaScript thread during data loading.
// Skeletons that match real component dimensions look professional.
// Generic skeletons (random widths) look cheap.
import { cn } from '@/lib/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-[#0f2040]', className)} aria-hidden="true" />
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e3a5f] bg-[#0c1a2e] p-5" aria-label="Loading metric">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn('h-4', i === 0 ? 'w-8' : 'w-full')} />
        </td>
      ))}
    </tr>
  )
}

export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-1 h-32" aria-label="Loading chart">
      {[40,65,45,80,55,70,35,90,60,75,50,85].map((h, i) => (
        <Skeleton key={i} style={{ height: `${h}%` }} className="flex-1" />
      ))}
    </div>
  )
}

---

## Empty State Pattern

// /components/app/shared/empty-state.tsx
// An empty state without an action is a dead end.
// Every empty state tells the user: here is what is missing, here is how to fix it.
// This is progressive disclosure — guide the user forward.
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon:        LucideIcon
  title:       string       // Short: "No API keys yet" not "You haven't added any"
  description: string       // One sentence explaining what belongs here
  action?:     React.ReactNode
  size?:       'sm' | 'md' | 'lg'
  className?:  string
}

export function EmptyState({ icon: Icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  const padding = { sm: 'py-8', md: 'py-16', lg: 'py-24' }
  return (
    <div className={cn('flex flex-col items-center justify-center px-8 text-center', padding[size], className)} role="status">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0c1a2e] border border-[#1e3a5f]">
        <Icon className="h-6 w-6 text-[#4a6380]" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-[#c8d8e8]">{title}</h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#4a6380]">{description}</p>
      {action}
    </div>
  )
}

---

## TanStack Query Configuration

// staleTime: 30_000 (30 seconds)
// Data is "fresh" for 30 seconds after fetch. If user navigates away
// and comes back within 30s, cached data shows instantly — no re-fetch.
// staleTime: 0 re-fetches on every mount — unnecessary loading states.

// retry: 2
// On network error, retry twice. Most transient issues resolve in 1-2 retries.
// retry: 3+ creates too long a delay before showing the error.

export function useKeys() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id,provider,nickname,key_hint,is_active,is_valid,last_used,rotation_due,created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 30_000,
    retry:     2,
  })
}

---

## Responsive Layout Rules

// Design mobile-first. Add complexity at larger breakpoints.
// Starting with desktop and trying to make it work on mobile
// almost always results in hidden content and broken layouts.

// KPI grid: 2 columns mobile, 4 desktop
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

// Chart + sidebar: stacked mobile, side-by-side desktop
<div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">

// Sidebar: hidden mobile, icon-only tablet, full desktop
<aside className="hidden md:flex md:w-14 lg:w-[220px] flex-col">

// Mobile bottom navigation — 5 tabs max
// More than 5 is too small to tap accurately on a phone
<nav className="fixed bottom-0 left-0 right-0 border-t border-[#1e3a5f] bg-[#060d18] md:hidden">

// Breakpoints:
// 375px  — mobile: single column, bottom tabs
// 768px  — tablet: 2-column KPIs, icon-only sidebar
// 1024px — desktop: full sidebar, 3-4 column layouts
// 1280px — wide: max-width 1200px centred