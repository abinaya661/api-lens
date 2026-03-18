// ============================================
// Envelope Encryption Service
// AES-256-GCM with master-key-wrapped DEK
// ============================================

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV for GCM
const KEY_LENGTH = 32;  // 256-bit key

/**
 * Get the master key from environment.
 * ENCRYPTION_KEY must be 64 hex characters (32 bytes).
 */
function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt plaintext with a given key using AES-256-GCM.
 */
function aesEncrypt(plaintext: Buffer, key: Buffer): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: encrypted, iv, tag };
}

/**
 * Decrypt ciphertext with a given key using AES-256-GCM.
 */
function aesDecrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Wrap a DEK with the master key.
 * Returns base64-encoded string: iv(12) + tag(16) + ciphertext
 */
function wrapDEK(dek: Buffer): string {
  const masterKey = getMasterKey();
  const { ciphertext, iv, tag } = aesEncrypt(dek, masterKey);
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/**
 * Unwrap a DEK using the master key.
 */
function unwrapDEK(wrapped: string): Buffer {
  const masterKey = getMasterKey();
  const buf = Buffer.from(wrapped, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buf.subarray(IV_LENGTH + 16);
  return aesDecrypt(ciphertext, masterKey, iv, tag);
}

export interface EncryptedPayload {
  ciphertext: string;  // base64 encoded
  iv: string;          // base64 encoded
  tag: string;         // base64 encoded
  dek: string;         // base64 encoded (master-key-wrapped DEK)
}

/**
 * Encrypt an API key for storage.
 * Generates a random DEK, encrypts the plaintext, then wraps the DEK with the master key.
 */
export function encryptCredentials(plaintext: string): EncryptedPayload {
  const dek = randomBytes(KEY_LENGTH);
  const { ciphertext, iv, tag } = aesEncrypt(Buffer.from(plaintext, 'utf8'), dek);

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    dek: wrapDEK(dek), // DEK is wrapped with master key
  };
}

/**
 * Decrypt stored API key credentials.
 * Unwraps the DEK with the master key, then decrypts the ciphertext.
 */
export function decryptCredentials(payload: EncryptedPayload): string {
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const dek = unwrapDEK(payload.dek); // Unwrap DEK using master key

  return aesDecrypt(ciphertext, dek, iv, tag).toString('utf8');
}

/**
 * Extract the last 4 characters of a key for display (key hint).
 */
export function extractKeyHint(key: string): string {
  return key.trim().slice(-4);
}
