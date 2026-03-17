// ============================================
// Sync Job — Trigger.dev Task
// Runs hourly: for each user → for each key → poll → normalize → store → evaluate alerts
// ============================================

// TODO: Implement with Trigger.dev v4 SDK
// import { task, schedules } from '@trigger.dev/sdk/v3';
// import { getProviderModule } from '@/lib/providers';
// import { calculateCost, getModelPricing } from '@/lib/pricing';
// import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Hourly sync pipeline:
 * 1. Fetch all active API keys
 * 2. For each key, call provider module to get usage
 * 3. Apply pricing engine to convert tokens → USD
 * 4. Store usage records in Supabase
 * 5. Evaluate alert thresholds
 * 6. Send notifications for triggered alerts
 */

export const syncPipeline = {
  id: 'sync-pipeline',
  // Will be implemented as a Trigger.dev cron task
  // cron: '0 * * * *' // Every hour
};

/**
 * Key rotation reminder:
 * Runs daily, checks all keys older than 80 days
 */
export const keyRotationCheck = {
  id: 'key-rotation-check',
  // cron: '0 0 * * *' // Daily at midnight
};

/**
 * Waste detection:
 * Runs daily, flags keys with zero activity for 30+ days
 */
export const wasteDetection = {
  id: 'waste-detection',
  // cron: '0 1 * * *' // Daily at 1 AM
};

/**
 * Weekly custom cost reminder:
 * Sends email + in-app prompt for custom platform keys every Monday
 */
export const customCostReminder = {
  id: 'custom-cost-reminder',
  // cron: '0 9 * * 1' // Every Monday at 9 AM
};

/**
 * Monthly report generation:
 * Runs on the 1st of each month
 */
export const monthlyReport = {
  id: 'monthly-report',
  // cron: '0 0 1 * *' // 1st of month at midnight
};
