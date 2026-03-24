import { describe, test, expect } from 'vitest';
import { createBudgetSchema } from '../lib/validations/budget';

describe('createBudgetSchema', () => {
  test('accepts valid budget', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 100,
    });
    expect(result.success).toBe(true);
  });

  test('rejects negative amount', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: -10,
    });
    expect(result.success).toBe(false);
  });

  test('rejects zero amount', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 0,
    });
    expect(result.success).toBe(false);
  });

  test('rejects amount over 1,000,000', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 1_000_001,
    });
    expect(result.success).toBe(false);
  });

  test('accepts amount exactly 1,000,000', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 1_000_000,
    });
    expect(result.success).toBe(true);
  });

  test('defaults period to monthly', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.period).toBe('monthly');
    }
  });

  test('accepts weekly period', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'global',
      amount_usd: 100,
      period: 'weekly',
    });
    expect(result.success).toBe(true);
  });

  test('requires valid scope', () => {
    const result = createBudgetSchema.safeParse({
      scope: 'invalid_scope',
      amount_usd: 100,
    });
    expect(result.success).toBe(false);
  });

  test('accepts all valid scopes', () => {
    for (const scope of ['global', 'platform', 'project', 'key']) {
      const result = createBudgetSchema.safeParse({
        scope,
        amount_usd: 100,
      });
      expect(result.success).toBe(true);
    }
  });
});
