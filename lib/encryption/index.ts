// ============================================
// Envelope Encryption Service
// AES-256-GCM data key per API key
// Master key stored in Supabase Vault
// ============================================

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag
const KEY_LENGTH = 32;  // 256-bit key

export interface EncryptedPayload {
  ciphertext: string;  // base64 encoded
  iv: string;          // base64 encoded
  tag: string;         // base64 encoded
  dek: string;         // base64 encoded (encrypted data encryption key)
}

/**
 * Generate a random Data Encryption Key (DEK)
 */
function generateDEK(): Buffer {
  return randomBytes(KEY_LENGTH);
}

/**
 * Encrypt plaintext using a DEK
 */
function encryptWithDEK(plaintext: string, dek: Buffer): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return { ciphertext: encrypted, iv, tag };
}

/**
 * Decrypt ciphertext using a DEK
 */
function decryptWithDEK(ciphertext: Buffer, dek: Buffer, iv: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Encrypt an API key's credentials for storage.
 * 
 * In production, the DEK should be encrypted with the master key from Supabase Vault.
 * For now, we store the DEK alongside (TODO: integrate Vault wrapping).
 */
export function encryptCredentials(plaintext: string): EncryptedPayload {
  const dek = generateDEK();
  const { ciphertext, iv, tag } = encryptWithDEK(plaintext, dek);
  
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    dek: dek.toString('base64'), // TODO: Wrap with Vault master key
  };
}

/**
 * Decrypt stored API key credentials.
 */
export function decryptCredentials(payload: EncryptedPayload): string {
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const dek = Buffer.from(payload.dek, 'base64'); // TODO: Unwrap with Vault master key
  
  return decryptWithDEK(ciphertext, dek, iv, tag);
}

/**
 * Extract the last 4 characters of a key for display (key hint).
 * Works for various key formats.
 */
export function extractKeyHint(key: string): string {
  const cleaned = key.trim();
  return cleaned.slice(-4);
}
