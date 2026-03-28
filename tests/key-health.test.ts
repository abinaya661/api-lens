import { describe, expect, test } from 'vitest';
import { getHealthConfig, getTrackabilityConfig, getVerificationConfig } from '../lib/utils/key-health';
import type { ApiKey } from '../types/database';

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'key_123',
    company_id: 'company_123',
    project_id: null,
    user_id: 'user_123',
    provider: 'openai',
    nickname: 'Test Key',
    encrypted_credentials: {
      ciphertext: 'cipher',
      iv: 'iv',
      tag: 'tag',
      dek: 'dek',
    },
    encrypted_key: '{}',
    key_hint: '1234',
    is_active: true,
    last_synced_at: null,
    last_error: null,
    is_valid: true,
    last_validated: '2026-03-25T00:00:00.000Z',
    last_used: null,
    rotation_due: null,
    notes: null,
    endpoint_url: null,
    detected_pattern: null,
    consecutive_failures: 0,
    last_failure_reason: null,
    has_usage_api: true,
    proxy_enabled: false,
    proxy_key_id: null,
    created_at: '2026-03-25T00:00:00.000Z',
    updated_at: '2026-03-25T00:00:00.000Z',
    ...overrides,
  };
}

describe('getHealthConfig', () => {
  test('returns Healthy for active verified keys', () => {
    expect(getHealthConfig(makeKey()).label).toBe('Healthy');
  });

  test('returns Inactive for failed keys', () => {
    expect(getHealthConfig(makeKey({ is_valid: false, last_failure_reason: 'provider rejected key' })).label).toBe('Inactive');
  });

  test('returns Revoked for manually disabled keys without a failure reason', () => {
    expect(getHealthConfig(makeKey({ is_active: false, last_failure_reason: null })).label).toBe('Revoked');
  });
});

describe('verification and trackability helpers', () => {
  test('marks a validated key as Verified', () => {
    expect(getVerificationConfig(makeKey()).label).toBe('Verified');
  });

  test('marks failed validation as Failed', () => {
    expect(getVerificationConfig(makeKey({ is_valid: false })).label).toBe('Failed');
  });

  test('marks unvalidated keys as Unchecked', () => {
    expect(getVerificationConfig(makeKey({ last_validated: null, is_valid: false })).label).toBe('Unchecked');
  });

  test('marks supported keys as Trackable', () => {
    expect(getTrackabilityConfig(makeKey()).label).toBe('Trackable');
  });

  test('marks unsupported providers as Unsupported', () => {
    expect(
      getTrackabilityConfig(makeKey({
        has_usage_api: false,
        last_failure_reason: 'This provider is not supported for API key tracking yet.',
      })).label,
    ).toBe('Unsupported');
  });
});
