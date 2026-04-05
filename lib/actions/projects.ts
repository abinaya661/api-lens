'use server';

import { createClient } from '@/lib/supabase/server';
import { createProjectSchema, updateProjectSchema, type CreateProjectInput, type UpdateProjectInput } from '@/lib/validations/project';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import type { Project } from '@/types/database';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export async function listProjects(): Promise<ActionResult<Project[]>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', auth.companyId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as Project[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getProject(id: string): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Project, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createProject(input: CreateProjectInput): Promise<ActionResult<Project>> {
  try {
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId || !auth.userId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: auth.userId,
        company_id: auth.companyId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Project, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateProject(input: UpdateProjectInput): Promise<ActionResult<Project>> {
  try {
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Validation failed' };

    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { id, ...updates } = parsed.data;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Project, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    await supabase
      .from('api_keys')
      .update({ project_id: null })
      .eq('project_id', id)
      .eq('company_id', auth.companyId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('company_id', auth.companyId);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
