// ============================================
// Sync Job — Trigger.dev Task
// Runs hourly: for each user → for each key → poll → normalize → store → evaluate alerts
// ============================================

import { schedules, task } from '@trigger.dev/sdk/v3';
import { getProviderModule } from '@/lib/providers';
import { calculateCost, getModelPricing } from '@/lib/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptCredentials, type EncryptedPayload } from '@/lib/encryption';
import type { ProviderSyncResult } from '@/types';

function parseCredentials(decrypted: string): Record<string, string> {
  try {
    return JSON.parse(decrypted);
  } catch {
    return { api_key: decrypted };
  }
}

/**
 * Hourly sync pipeline:
 * 1. Fetch all active API keys
 * 2. For each key, call provider module to get usage
 * 3. Apply pricing engine to convert tokens → USD
 * 4. Store usage records in Supabase
 * 5. Evaluate alert thresholds (budget/spike handled asynchronously or via webhook later)
 */
export const syncPipeline = schedules.task({
  id: 'sync-pipeline',
  cron: '0 * * * *', // Every hour
  run: async () => {
    const supabase = createAdminClient();
    
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, provider, encrypted_key, user_id, last_synced_at')
      .in('health', ['active', 'sync_error']); // also retry sync errors
      
    if (error) {
      console.error('Failed to fetch keys', error);
      return { synced: 0, error: error.message };
    }
    if (!keys?.length) return { synced: 0 };
    
    let synced = 0;
    
    for (const key of keys) {
      try {
        const payloadStr = key.encrypted_key;
        if (!payloadStr) continue;
        const encPayload = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
        const decrypted = decryptCredentials(encPayload as EncryptedPayload);
        const credentials = parseCredentials(decrypted);
        
        const module = getProviderModule(key.provider as any);
        if (!module) continue;
        
        const since = key.last_synced_at ? new Date(key.last_synced_at) : new Date(Date.now() - 86400000);
        
        const result: ProviderSyncResult = await module.fetchUsage(credentials, key.id, since);
        if (!result.success || !result.usage) {
          throw new Error(result.error ?? 'Unknown sync error');
        }
        
        // Save usage
        if (result.usage.length > 0) {
          // Calculate costs first
          const usageToInsert = await Promise.all(result.usage.map(async (u) => {
            const pricing = await getModelPricing(u.provider, u.model);
            let cost = 0;
            if (pricing) {
              cost = calculateCost(u.input_tokens, u.output_tokens, pricing);
            }
            return {
              key_id: u.key_id,
              user_id: key.user_id,
              provider: u.provider,
              model: u.model,
              input_tokens: u.input_tokens,
              output_tokens: u.output_tokens,
              cost_usd: cost,
              recorded_at: u.recorded_at,
              synced_at: new Date().toISOString(),
              date: u.recorded_at.split('T')[0],
              total_tokens: u.input_tokens + u.output_tokens,
              unit_type: 'requests',
              unit_count: 1, // Defaulting if not strictly batched
              request_count: 1,
              source: 'api_sync',
            };
          }));
          
          await supabase.from('usage_records').upsert(usageToInsert, { onConflict: 'key_id,model,recorded_at' });
        }
        
        // Update key successful sync status
        await supabase.from('api_keys').update({ 
          last_synced_at: new Date().toISOString(),
          health: 'active',
          consecutive_failures: 0
        }).eq('id', key.id);
        
        synced++;
        
      } catch (err: any) {
        // Record sync failure
        await supabase.from('api_keys').update({
          health: 'sync_error',
          last_failure_reason: err.message,
        }).eq('id', key.id);
      }
    }
    
    return { synced, total: keys.length };
  },
});

export const keyRotationCheck = schedules.task({
  id: 'key-rotation-check',
  cron: '0 0 * * *', // Daily at midnight
  run: async () => {
    // Stub implementation for key rotation alerts
    return { success: true };
  }
});

export const wasteDetection = schedules.task({
  id: 'waste-detection',
  cron: '0 1 * * *', // Daily at 1 AM
  run: async () => {
    // Stub implementation for waste detection
    return { success: true };
  }
});

export const customCostReminder = schedules.task({
  id: 'custom-cost-reminder',
  cron: '0 9 * * 1', // Every Monday at 9 AM
  run: async () => {
    return { success: true };
  }
});

export const monthlyReport = schedules.task({
  id: 'monthly-report',
  cron: '0 0 1 * *', // 1st of month at midnight
  run: async () => {
    return { success: true };
  }
});
