import { describe, test, expect, vi, beforeEach } from 'vitest';

// We need to test the in-memory fallback, so we test checkRateLimit with null limiter
// We must re-import after clearing module cache to get fresh memory store
describe('checkRateLimit in-memory fallback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('returns success when limiter is null (fallback mode)', async () => {
    const { checkRateLimit } = await import('../lib/ratelimit');
    const result = await checkRateLimit(null, 'test-user');
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test('in-memory fallback allows requests under limit', async () => {
    const { checkRateLimit } = await import('../lib/ratelimit');
    // Default memory limit is 100 requests per minute
    for (let i = 0; i < 50; i++) {
      const result = await checkRateLimit(null, 'user-under-limit');
      expect(result.success).toBe(true);
    }
  });

  test('in-memory fallback blocks requests over limit', async () => {
    const { checkRateLimit } = await import('../lib/ratelimit');
    // Exhaust the limit (100 requests)
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(null, 'user-over-limit');
    }
    // 101st request should be blocked
    const result = await checkRateLimit(null, 'user-over-limit');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('different identifiers have independent limits', async () => {
    const { checkRateLimit } = await import('../lib/ratelimit');
    // Exhaust limit for user-a
    for (let i = 0; i < 101; i++) {
      await checkRateLimit(null, 'user-a');
    }
    // user-b should still be allowed
    const result = await checkRateLimit(null, 'user-b');
    expect(result.success).toBe(true);
  });
});
