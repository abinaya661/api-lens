# Phase 1 — Data Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data with real Supabase CRUD via server actions + TanStack Query hooks. Every page shows real data, loading skeletons, empty states, and error states.

**Architecture:** Server Actions (`'use server'`) for all mutations and queries. TanStack Query hooks wrap each action for caching, refetching, and optimistic updates. Pages are rewired from local state + mock imports to hook-driven data. The real DB uses `user_id` ownership (not company_id) with RLS enforcing access.

**Tech Stack:** Next.js 15 Server Actions, Supabase SSR client (RLS-enforced), TanStack Query v5, Zod validation, TypeScript strict mode.

---

## Real DB Schema Reference

| Table | Key columns | RLS |
|-------|------------|-----|
| `profiles` | id (=auth.uid), full_name, company_name, timezone, currency, onboarded, role | own row |
| `projects` | id, user_id, name, description, color, is_active | own rows |
| `api_keys` | id, user_id, provider, nickname, encrypted_key, key_hint, is_active, is_valid, last_used, rotation_due, consecutive_failures | own rows |
| `project_keys` | id, project_id, key_id | via project ownership |
| `usage_records` | id, key_id, user_id, date, provider, model, input/output/total_tokens, cost_usd, request_count | own rows |
| `budgets` | id, user_id, scope, scope_id, platform, amount_usd, period, alert_50/75/90/100 | own rows |
| `alerts` | id, user_id, type, severity, title, message, is_read, is_emailed, metadata | own rows |
| `subscriptions` | id, user_id, plan, trial_ends_at, razorpay fields | own row (SELECT only) |
| `platforms` | id, name, category, adapter_pattern, auth_type, color, unit_type | authenticated read |
| `price_snapshots` | id, provider, model, input_per_mtok, output_per_mtok | public read |
| `saved_estimates` | id, user_id, project_id, name, provider, model, messages_per_day, avg_input/output_tokens | own rows |

---

## File Structure

### New files to create:

```
lib/actions/
  keys.ts          — Server actions for API key CRUD
  projects.ts      — Server actions for project CRUD
  budgets.ts       — Server actions for budget CRUD
  alerts.ts        — Server actions for alert operations
  dashboard.ts     — Server action for dashboard aggregation
  settings.ts      — Server actions for profile CRUD

lib/validations/
  key.ts           — Zod schemas for key operations
  project.ts       — Zod schemas for project operations
  budget.ts        — Zod schemas for budget operations
  settings.ts      — Zod schemas for settings operations

hooks/
  use-keys.ts      — TanStack Query hooks for keys
  use-projects.ts  — TanStack Query hooks for projects
  use-budgets.ts   — TanStack Query hooks for budgets
  use-alerts.ts    — TanStack Query hooks for alerts
  use-dashboard.ts — TanStack Query hook for dashboard
  use-profile.ts   — TanStack Query hook for profile/settings
```

### Files to modify:

```
app/(dashboard)/dashboard/page.tsx   — Rewire to useDashboard()
app/(dashboard)/keys/page.tsx        — Rewire to useKeys()
app/(dashboard)/projects/page.tsx    — Rewire to useProjects()
app/(dashboard)/budgets/page.tsx     — Rewire to useBudgets()
app/(dashboard)/alerts/page.tsx      — Rewire to useAlerts()
app/(dashboard)/reports/page.tsx     — Rewire to useUsageRecords()
app/(dashboard)/settings/page.tsx    — Rewire to useProfile()
app/(dashboard)/estimator/page.tsx   — Rewire to usePriceSnapshots()
```

### Files to delete:

```
lib/mock-data.ts
lib/mock-data-budgets.ts
lib/mock-data-projects.ts
lib/mock-data-reports.ts
lib/mock-data-estimator.ts
```

---

## Task 1: Zod Validation Schemas

**Files:**
- Create: `lib/validations/key.ts`
- Create: `lib/validations/project.ts`
- Create: `lib/validations/budget.ts`
- Create: `lib/validations/settings.ts`

- [ ] **Step 1: Create key validation schemas**

```typescript
// lib/validations/key.ts
import { z } from 'zod';

export const addKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  nickname: z.string().min(1, 'Label is required').max(100),
  api_key: z.string().min(1, 'API key is required'),
  project_id: z.string().uuid().optional(),
  endpoint_url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export const updateKeySchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().min(1).max(100).optional(),
  project_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type AddKeyInput = z.infer<typeof addKeySchema>;
export type UpdateKeyInput = z.infer<typeof updateKeySchema>;
```

- [ ] **Step 2: Create project validation schemas**

```typescript
// lib/validations/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f46e5'),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_active: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
```

- [ ] **Step 3: Create budget validation schemas**

```typescript
// lib/validations/budget.ts
import { z } from 'zod';

export const createBudgetSchema = z.object({
  scope: z.enum(['global', 'platform', 'project', 'key']),
  scope_id: z.string().uuid().optional(),
  platform: z.string().optional(),
  amount_usd: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'weekly']).default('monthly'),
  alert_50: z.boolean().default(true),
  alert_75: z.boolean().default(true),
  alert_90: z.boolean().default(true),
  alert_100: z.boolean().default(true),
});

export const updateBudgetSchema = z.object({
  id: z.string().uuid(),
  amount_usd: z.number().positive().optional(),
  alert_50: z.boolean().optional(),
  alert_75: z.boolean().optional(),
  alert_90: z.boolean().optional(),
  alert_100: z.boolean().optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
```

- [ ] **Step 4: Create settings validation schemas**

```typescript
// lib/validations/settings.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  company_name: z.string().max(100).nullable().optional(),
  timezone: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

- [ ] **Step 5: Commit**

---

## Task 2: Server Actions — Keys

**Files:**
- Create: `lib/actions/keys.ts`

- [ ] **Step 1: Create keys server actions**

```typescript
// lib/actions/keys.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { addKeySchema, updateKeySchema, type AddKeyInput, type UpdateKeyInput } from '@/lib/validations/key';
import { encryptCredentials } from '@/lib/encryption';
import type { ApiKey } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function listKeys(): Promise<ActionResult<ApiKey[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addKey(input: AddKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = addKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { api_key, provider, nickname, project_id, endpoint_url, notes } = parsed.data;

    // Encrypt the API key
    const encrypted = encryptCredentials(api_key);
    const keyHint = api_key.slice(-4);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        nickname,
        encrypted_key: encrypted,
        key_hint: keyHint,
        endpoint_url: endpoint_url ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // If project_id provided, create project_keys link
    if (project_id && data) {
      await supabase.from('project_keys').insert({
        project_id,
        key_id: data.id,
      });
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateKey(input: UpdateKeyInput): Promise<ActionResult<ApiKey>> {
  try {
    const parsed = updateKeySchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { id, ...updates } = parsed.data;

    // Remove project_id from direct updates (handled via project_keys)
    const { project_id, ...keyUpdates } = updates as Record<string, unknown> & { project_id?: string | null };

    if (Object.keys(keyUpdates).length > 0) {
      const { error } = await supabase
        .from('api_keys')
        .update(keyUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) return { data: null, error: error.message };
    }

    // Fetch updated record
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteKey(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
```

- [ ] **Step 2: Commit**

---

## Task 3: Server Actions — Projects

**Files:**
- Create: `lib/actions/projects.ts`

- [ ] **Step 1: Create projects server actions**

```typescript
// lib/actions/projects.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createProjectSchema, updateProjectSchema, type CreateProjectInput, type UpdateProjectInput } from '@/lib/validations/project';
import type { Project } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function listProjects(): Promise<ActionResult<Project[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getProject(id: string): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createProject(input: CreateProjectInput): Promise<ActionResult<Project>> {
  try {
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, ...parsed.data })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateProject(input: UpdateProjectInput): Promise<ActionResult<Project>> {
  try {
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { id, ...updates } = parsed.data;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
```

- [ ] **Step 2: Commit**

---

## Task 4: Server Actions — Budgets, Alerts, Dashboard, Settings

**Files:**
- Create: `lib/actions/budgets.ts`
- Create: `lib/actions/alerts.ts`
- Create: `lib/actions/dashboard.ts`
- Create: `lib/actions/settings.ts`

- [ ] **Step 1: Create budgets server actions**

Follows same pattern as projects: listBudgets, createBudget, updateBudget, deleteBudget. All use Zod validation, server Supabase client, user_id ownership.

- [ ] **Step 2: Create alerts server actions**

```typescript
// lib/actions/alerts.ts — key functions:
export async function getAlerts()          // SELECT * WHERE user_id, ORDER BY created_at DESC
export async function getUnreadCount()     // SELECT count WHERE is_read = false
export async function markRead(id)         // UPDATE is_read = true WHERE id
export async function markAllRead()        // UPDATE is_read = true WHERE user_id AND is_read = false
```

- [ ] **Step 3: Create dashboard server action**

```typescript
// lib/actions/dashboard.ts — single aggregation query
export async function getDashboardData()
// Returns: total_spend_mtd, daily_spend[], platform_breakdown[], top_keys[], recent_alerts[], active_key_count, last_synced_at
// Queries: usage_records (current month), api_keys, alerts (last 5), budgets (global)
```

- [ ] **Step 4: Create settings server actions**

```typescript
// lib/actions/settings.ts
export async function getProfile()         // SELECT * FROM profiles WHERE id = user.id
export async function updateProfile(input) // UPDATE profiles SET ... WHERE id = user.id
```

- [ ] **Step 5: Commit**

---

## Task 5: TanStack Query Hooks

**Files:**
- Create: `hooks/use-keys.ts`
- Create: `hooks/use-projects.ts`
- Create: `hooks/use-budgets.ts`
- Create: `hooks/use-alerts.ts`
- Create: `hooks/use-dashboard.ts`
- Create: `hooks/use-profile.ts`

- [ ] **Step 1: Create keys hook**

```typescript
// hooks/use-keys.ts
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
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('API key added successfully');
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
```

- [ ] **Step 2: Create remaining hooks**

Same pattern for projects, budgets, alerts, dashboard, profile. Each hook:
- `useQuery` wrapping the corresponding server action
- `useMutation` for create/update/delete with `invalidateQueries` and toast notifications
- Query keys: `['projects']`, `['budgets']`, `['alerts']`, `['dashboard']`, `['profile']`

- [ ] **Step 3: Commit**

---

## Task 6: Rewire Dashboard Page

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard page**

Replace mock imports with `useDashboard()` hook. Show:
- `SkeletonLoader` while loading
- `ErrorState` on error
- `EmptyState` when no data (no keys added yet)
- Real data when available

The page stays `'use client'` but now uses the hook instead of mock data.

- [ ] **Step 2: Commit**

---

## Task 7: Rewire Keys Page

**Files:**
- Modify: `app/(dashboard)/keys/page.tsx`

- [ ] **Step 1: Rewrite keys page**

Replace `mockApiKeys` and `mockProjects` with `useKeys()` and `useProjects()`. Modal form calls `useAddKey().mutate()`. Revoke calls `useUpdateKey().mutate()`. Delete calls `useDeleteKey().mutate()`.

- [ ] **Step 2: Commit**

---

## Task 8: Rewire Projects Page

**Files:**
- Modify: `app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Rewrite projects page**

Replace `mockProjects` with `useProjects()`. Create/edit modal calls `useCreateProject().mutate()` / `useUpdateProject().mutate()`. Delete calls `useDeleteProject().mutate()`.

- [ ] **Step 2: Commit**

---

## Task 9: Rewire Budgets Page

**Files:**
- Modify: `app/(dashboard)/budgets/page.tsx`

- [ ] **Step 1: Rewrite budgets page**

Replace `mockBudgets` with `useBudgets()`. Create/edit/delete use respective mutations.

- [ ] **Step 2: Commit**

---

## Task 10: Rewire Alerts Page

**Files:**
- Modify: `app/(dashboard)/alerts/page.tsx`

- [ ] **Step 1: Rewrite alerts page**

Replace `mockAlerts` with `useAlerts()`. Acknowledge calls `useMarkRead().mutate()`. Acknowledge All calls `useMarkAllRead().mutate()`.

- [ ] **Step 2: Commit**

---

## Task 11: Rewire Reports, Estimator, Settings Pages

**Files:**
- Modify: `app/(dashboard)/reports/page.tsx`
- Modify: `app/(dashboard)/estimator/page.tsx`
- Modify: `app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Rewrite reports page** — Query `usage_records` with date filters
- [ ] **Step 2: Rewrite estimator page** — Query `price_snapshots` for real model pricing
- [ ] **Step 3: Rewrite settings page** — Use `useProfile()` hook for real profile data
- [ ] **Step 4: Commit**

---

## Task 12: Delete Mock Data + Final Verification

**Files:**
- Delete: `lib/mock-data.ts`
- Delete: `lib/mock-data-budgets.ts`
- Delete: `lib/mock-data-projects.ts`
- Delete: `lib/mock-data-reports.ts`
- Delete: `lib/mock-data-estimator.ts`

- [ ] **Step 1: Delete all mock data files**
- [ ] **Step 2: Run `npx next build` — must pass with zero errors**
- [ ] **Step 3: Grep for any remaining mock-data imports — must find zero**
- [ ] **Step 4: Commit**

---

## Acceptance Criteria

- [ ] All mock-data files deleted
- [ ] Create project in UI → row in Supabase `projects` table
- [ ] Add key → encrypted row in `api_keys`, hint shows last 4 chars
- [ ] Empty dashboard shows EmptyState, not blank screen
- [ ] Every page: loading skeleton → empty state (with action button) → real data → error state
- [ ] `npx next build` passes with zero errors
