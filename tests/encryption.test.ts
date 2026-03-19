import { test, expect } from 'vitest';
import { extractKeyHint } from '../lib/encryption';

test('extractKeyHint returns last 4 chars', () => {
  expect(extractKeyHint('sk-1234567890abcdef')).toBe('cdef');
});
