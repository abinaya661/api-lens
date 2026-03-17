'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key && host) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      });
    }
  }, []);

  return <>{children}</>;
}

// Analytics event helpers
export const analytics = {
  signup: (method: 'email' | 'google') =>
    posthog.capture('signup', { method }),

  keyAdded: (provider: string) =>
    posthog.capture('key_added', { provider }),

  projectCreated: () =>
    posthog.capture('project_created'),

  budgetSet: (scope: string) =>
    posthog.capture('budget_set', { scope }),

  alertTriggered: (type: string) =>
    posthog.capture('alert_triggered', { type }),

  estimatorUsed: (provider: string, model: string) =>
    posthog.capture('estimator_used', { provider, model }),

  subscriptionStarted: (plan: string) =>
    posthog.capture('subscription_started', { plan }),

  identify: (userId: string, traits?: Record<string, unknown>) =>
    posthog.identify(userId, traits),
};
