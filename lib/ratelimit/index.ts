// ============================================
// Upstash Redis Rate Limiter
// ============================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only create clients if env vars are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Rate limiter for API routes: 100 requests per minute
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'api_lens:api',
    })
  : null;

/**
 * Rate limiter for auth routes: 10 requests per minute
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'api_lens:auth',
    })
  : null;

/**
 * Rate limiter for manual sync: 1 request per minute
 */
export const syncRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, '1 m'),
      analytics: true,
      prefix: 'api_lens:sync',
    })
  : null;

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>();
const MEMORY_WINDOW_MS = 60_000;
const MEMORY_MAX_REQUESTS = 100;

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}

function memoryRateLimit(
  identifier: string,
  maxRequests = MEMORY_MAX_REQUESTS,
): { success: boolean; remaining: number; reset: number } {
  // Periodic cleanup to prevent memory leaks
  if (memoryStore.size > 10000) cleanupMemoryStore();

  const now = Date.now();
  const entry = memoryStore.get(identifier);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + MEMORY_WINDOW_MS });
    return { success: true, remaining: maxRequests - 1, reset: now + MEMORY_WINDOW_MS };
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }
  return { success: true, remaining: maxRequests - entry.count, reset: entry.resetAt };
}

/**
 * Check rate limit for a given identifier.
 * Falls back to in-memory rate limiting if Redis is not configured.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!limiter) {
    return memoryRateLimit(identifier);
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
