import { describe, test, expect } from 'vitest';
import { getSafeRedirect } from '../lib/utils/safe-redirect';

describe('getSafeRedirect', () => {
  test('allows /dashboard', () => {
    expect(getSafeRedirect('/dashboard')).toBe('/dashboard');
  });

  test('allows /keys/123', () => {
    expect(getSafeRedirect('/keys/123')).toBe('/keys/123');
  });

  test('allows nested paths', () => {
    expect(getSafeRedirect('/settings/profile')).toBe('/settings/profile');
  });

  test('blocks //evil.com (protocol-relative URL)', () => {
    expect(getSafeRedirect('//evil.com')).toBe('/dashboard');
  });

  test('blocks https://evil.com', () => {
    expect(getSafeRedirect('https://evil.com')).toBe('/dashboard');
  });

  test('blocks javascript:alert(1)', () => {
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/dashboard');
  });

  test('returns /dashboard for null', () => {
    expect(getSafeRedirect(null)).toBe('/dashboard');
  });

  test('returns /dashboard for empty string', () => {
    expect(getSafeRedirect('')).toBe('/dashboard');
  });

  test('blocks paths not starting with /', () => {
    expect(getSafeRedirect('evil.com/hack')).toBe('/dashboard');
  });
});
