import type { SupabaseClient } from '@supabase/supabase-js';

export async function logAudit(
  supabase: SupabaseClient,
  params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    // Audit logging should not break the main flow
    console.error('Audit log failed:', e);
  }
}
