import { describe, test, expect } from 'vitest';
import { validateOrigin } from '../lib/utils/csrf';

function createMockRequest(origin: string | null, host: string | null): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  if (host) headers.set('host', host);
  return new Request('https://example.com/api/test', { headers });
}

describe('validateOrigin', () => {
  test('accepts matching origin and host', () => {
    const req = createMockRequest('https://apilens.tech', 'apilens.tech');
    expect(validateOrigin(req)).toBe(true);
  });

  test('accepts matching origin and host with port', () => {
    const req = createMockRequest('http://localhost:3000', 'localhost:3000');
    expect(validateOrigin(req)).toBe(true);
  });

  test('rejects mismatched origin', () => {
    const req = createMockRequest('https://evil.com', 'apilens.tech');
    expect(validateOrigin(req)).toBe(false);
  });

  test('rejects missing origin header', () => {
    const req = createMockRequest(null, 'apilens.tech');
    expect(validateOrigin(req)).toBe(false);
  });

  test('rejects missing host header', () => {
    const req = createMockRequest('https://apilens.tech', null);
    expect(validateOrigin(req)).toBe(false);
  });

  test('rejects both headers missing', () => {
    const req = createMockRequest(null, null);
    expect(validateOrigin(req)).toBe(false);
  });
});
