// ============================================
// Trigger.dev Configuration
// ============================================

export const config = {
  project: 'api-lens',
  logLevel: 'log' as const,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 5000,
      maxTimeoutInMs: 45000,
      factor: 3,
    },
  },
  dirs: ['./trigger'],
};
