import { describe, test, expect } from 'vitest';
import { encryptCredentials, decryptCredentials, extractKeyHint } from '../lib/encryption';

describe('encryptCredentials / decryptCredentials', () => {
  test('round-trip: encrypt then decrypt returns original key', () => {
    const key = 'sk-1234567890abcdef1234567890abcdef';
    const encrypted = encryptCredentials(key);
    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toBe(key);
  });

  test('encrypted payload has version field set to 1', () => {
    const encrypted = encryptCredentials('test-key');
    expect(encrypted.version).toBe(1);
  });

  test('encrypted payload contains all required fields', () => {
    const encrypted = encryptCredentials('test-key');
    expect(encrypted).toHaveProperty('version');
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted).toHaveProperty('dek');
  });

  test('different keys produce different ciphertexts', () => {
    const enc1 = encryptCredentials('key-aaa');
    const enc2 = encryptCredentials('key-bbb');
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  test('same key encrypted twice produces different ciphertexts (random DEK)', () => {
    const enc1 = encryptCredentials('same-key');
    const enc2 = encryptCredentials('same-key');
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  test('handles empty string', () => {
    const encrypted = encryptCredentials('');
    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toBe('');
  });

  test('handles very long key (10000 chars)', () => {
    const longKey = 'x'.repeat(10000);
    const encrypted = encryptCredentials(longKey);
    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toBe(longKey);
  });

  test('handles special characters and unicode', () => {
    const specialKey = 'sk-🔑-tëst-键-مفتاح';
    const encrypted = encryptCredentials(specialKey);
    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toBe(specialKey);
  });

  test('decryption fails with tampered ciphertext', () => {
    const encrypted = encryptCredentials('secret-key');
    encrypted.ciphertext = Buffer.from('tampered').toString('base64');
    expect(() => decryptCredentials(encrypted)).toThrow();
  });

  test('decryption fails with wrong tag', () => {
    const encrypted = encryptCredentials('secret-key');
    encrypted.tag = Buffer.from('0'.repeat(16)).toString('base64');
    expect(() => decryptCredentials(encrypted)).toThrow();
  });

  test('legacy payload without version field still decrypts (backward compat)', () => {
    const encrypted = encryptCredentials('legacy-key');
    const withoutVersion = { ...encrypted };
    delete withoutVersion.version;
    const decrypted = decryptCredentials(withoutVersion);
    expect(decrypted).toBe('legacy-key');
  });

  test('rejects unsupported encryption version', () => {
    const encrypted = encryptCredentials('test');
    encrypted.version = 99;
    expect(() => decryptCredentials(encrypted)).toThrow('Unsupported encryption version: 99');
  });
});

describe('extractKeyHint', () => {
  test('returns last 4 chars for normal key', () => {
    expect(extractKeyHint('sk-1234567890abcdef')).toBe('cdef');
  });

  test('returns **** for key shorter than 8 chars', () => {
    expect(extractKeyHint('short')).toBe('****');
  });

  test('returns **** for key with exactly 7 chars', () => {
    expect(extractKeyHint('1234567')).toBe('****');
  });

  test('returns last 4 for key with exactly 8 chars', () => {
    expect(extractKeyHint('12345678')).toBe('5678');
  });

  test('trims whitespace before processing', () => {
    expect(extractKeyHint('  sk-1234567890abcdef  ')).toBe('cdef');
  });

  test('returns **** for empty string', () => {
    expect(extractKeyHint('')).toBe('****');
  });

  test('handles key with special characters', () => {
    expect(extractKeyHint('sk-ant-api3!@#$')).toBe('!@#$');
  });
});
