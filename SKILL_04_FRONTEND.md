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

shadcn/ui variant: New York. Theme: zinc.

---

## Design Token System

// /styles/globals.css
// CSS variables instead of hardcoded Tailwind colour names.
// To change brand colour: change one line here, not 200 component files.
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

Fonts: Syne for all UI text. JetBrains Mono for keys, numbers, code.
All numeric values use: className="font-mono tabular-nums"
Dark mode is the default. Both modes are fully implemented.

---

## Chart Colour Palette — colourblind-safe

// Use these colours in this order for all charts.
// They are distinguishable for the 8% of people with colour blindness.
// Never use red + green adjacent. Never use only colour to convey meaning.
export const CHART_COLOURS = [
  '#4f46e5', // brand indigo
  '#f97316', // orange
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#10b981', // emerald
  '#64748b', // slate
] as const

// Platform-specific colours — consistent across all charts
export const PLATFORM_COLOURS: Record<string, string> = {
  openai:      '#10a37f',
  anthropic:   '#d97706',
  mistral:     '#7c3aed',
  cohere:      '#39d353',
  openrouter:  '#6366f1',
  gemini:      '#4285f4',
  vertex_ai:   '#34a853',
  azure_openai:'#0078d4',
  bedrock:     '#ff9900',
  elevenlabs:  '#f97316',
  deepgram:    '#06b6d4',
  assemblyai:  '#3b82f6',
  replicate:   '#0ea5e9',
  fal:         '#f59e0b',
}

---

## Loading Skeleton Pattern

// /components/app/shared/loading-skeleton.tsx
// Skeletons affect perceived performance.
// "Something is happening" feels faster than "nothing then everything".
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

export function KeyCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e3a5f] bg-[#0c1a2e] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

---

## Empty State Pattern

// /components/app/shared/empty-state.tsx
// An empty state without an action is a dead end.
// Every empty state tells the user: here is what is missing, here is how to fix it.
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon:        LucideIcon
  title:       string       // Short: "No API keys yet"
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

## Error State Pattern

// /components/app/shared/error-state.tsx
// Never show a raw error message to users.
// Show what happened and what they can do next.
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?:   string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title   = 'Something went wrong',
  message = 'We could not load this data. Try refreshing.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center" role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
        <AlertCircle className="h-5 w-5 text-red-400" />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-[#e2e8f0]">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-[#4a6380]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  )
}

---

## Last Synced Indicator — show on all data views

// Always show "Last synced X minutes ago" on every page that displays usage data.
// This sets user expectations — especially for platforms with sync delays.
// Place in the top-right of the page header.

import { formatLastSynced } from '@/lib/utils/format'

interface LastSyncedProps {
  lastSyncedAt: string | null  // ISO string or null if never synced
}

export function LastSynced({ lastSyncedAt }: LastSyncedProps) {
  if (!lastSyncedAt) {
    return <span className="text-xs text-[#4a6380]">Never synced</span>
  }
  return (
    <span className="text-xs text-[#4a6380]">
      Last synced {formatLastSynced(lastSyncedAt)}
    </span>
  )
}

---

## TanStack Query Configuration

// /lib/query-client.ts
// staleTime: 30_000 — data is "fresh" for 30s after fetch.
// If user navigates away and back within 30s: cached data shows instantly.
// staleTime: 0 re-fetches on every mount — unnecessary loading spinners.
//
// retry: 2 — on network error, retry twice.
// retry: 3+ creates too long a delay before showing the error.

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry:     2,
      refetchOnWindowFocus: false,
    },
  },
})

// Example hook — follow this pattern for all data hooks
export function useKeys() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        // NEVER select encrypted_key in list queries — security rule 1
        .select('id,provider,nickname,key_hint,is_active,is_valid,last_used,rotation_due,consecutive_failures,created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 30_000,
    retry:     2,
  })
}

---

## Accessibility Rules

1. All interactive elements reachable by keyboard — Tab + Enter/Space
2. All icons have aria-hidden="true" — they are decorative
3. Loading skeletons have aria-hidden="true" or aria-label="Loading X"
4. Error states use role="alert"
5. Empty states use role="status"
6. Colour is never the only way to convey meaning — always pair with text or icon
7. Focus rings visible — never outline-none without a replacement
8. Form labels always present — never placeholder-only forms

---

## Responsive Layout Rules

// Design mobile-first. Add complexity at larger breakpoints.
// Starting with desktop and trying to fit mobile almost always hides content.

// KPI grid: 2 columns mobile, 4 desktop
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

// Chart + sidebar panel: stacked mobile, side-by-side desktop
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
// 1280px — wide: max-width 1200px centred, padding added

---

## Keyboard Shortcuts

// ⌘K only — command palette. No other global shortcuts.
// Implemented via cmdk library (ships with shadcn/ui CommandDialog).
// Show keyboard hint in UI: <kbd>⌘K</kbd>

// Shortcut display component
export function KbdShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-0.5">
      {keys.map(k => (
        <kbd key={k} className="inline-flex h-5 items-center rounded border border-[#1e3a5f] bg-[#0c1a2e] px-1 font-mono text-[10px] text-[#94a3b8]">
          {k}
        </kbd>
      ))}
    </span>
  )
}
// Usage: <KbdShortcut keys={['⌘', 'K']} />

---

## Demo Mode Banner

// /components/app/dashboard/demo-banner.tsx
// New users see realistic fake data immediately on signup.
// This banner tells them it is demo data and prompts them to add a real key.
// Dismiss button hides it for the session only — not permanently.

export function DemoBanner({ onAddKey }: { onAddKey: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#4f46e5]/30 bg-[#4f46e5]/10 px-4 py-3 mb-4">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 text-[#4f46e5]" />
        <p className="text-sm text-[#94a3b8]">
          You are viewing <span className="font-medium text-[#e2e8f0]">demo data</span>.
          Add your first API key to see your real spend.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAddKey}>Add API Key</Button>
        <button onClick={() => setDismissed(true)} className="text-[#4a6380] hover:text-[#94a3b8]">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
