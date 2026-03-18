'use server';

import { createClient } from '@/lib/supabase/server';
import { createBudgetSchema, updateBudgetSchema, type CreateBudgetInput, type UpdateBudgetInput } from '@/lib/validations/budget';
import type { Budget } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function listBudgets(): Promise<ActionResult<Budget[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createBudget(input: CreateBudgetInput): Promise<ActionResult<Budget>> {
  try {
    const parsed = createBudgetSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('budgets')
      .insert({ user_id: user.id, ...parsed.data })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateBudget(input: UpdateBudgetInput): Promise<ActionResult<Budget>> {
  try {
    const parsed = updateBudgetSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { id, ...updates } = parsed.data;

    const { data, error } = await supabase
      .from('budgets')
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

export async function deleteBudget(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
