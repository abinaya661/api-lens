import crypto from 'node:crypto'

// AES-256: 256-bit key — unbreakable by brute force today.
// GCM mode: provides confidentiality AND authenticity.
// The auth tag detects tampering — if someone modifies the stored
// ciphertext, decryption throws instead of returning garbage.
const ALGORITHM = 'aes-256-gcm' as const
const IV_BYTES   = 12  // 96-bit IV — GCM standard recommends exactly 12 bytes
const TAG_BYTES  = 16  // 128-bit auth tag — the maximum. Never use less.
const VERSION    = 'v1' as const

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hex chars. ' +
      'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getMasterKey()
  // New random IV for EVERY encryption — non-negotiable.
  // Reusing an IV with the same key in GCM mode is catastrophic.
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()  // Retrieved AFTER cipher.final()
  // Format: v1:ivHex:tagHex:ciphertextHex
  return `${VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error(`Invalid encryption format. Expected "${VERSION}:iv:tag:ciphertext"`)
  }
  const [, ivHex, tagHex, ctHex] = parts
  const key = getMasterKey()
  const decipher = crypto.createDecipheriv(
    ALGORITHM, key, Buffer.from(ivHex!, 'hex'), { authTagLength: TAG_BYTES }
  )
  // setAuthTag MUST be called before update/final.
  // If ciphertext was modified, final() throws. This is correct behaviour.
  decipher.setAuthTag(Buffer.from(tagHex!, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctHex!, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

export function getKeyHint(plaintext: string): string {
  // Stored as plain text separately — avoids decryption on every list page load.
  // The last 4 chars alone cannot reconstruct or guess the key.
  return plaintext.slice(-4)
}

export function maskForDisplay(provider: string, hint: string): string {
  const prefixes: Record<string, string> = {
    openai:    'sk-...',
    anthropic: 'sk-ant-...',
    gemini:    'AIza...',
    aws:       'AKIA...',
    azure:     'az-...',
    mistral:   'ms-...',
    cohere:    'co-...',
    custom:    '...',
  }
  return `${prefixes[provider] ?? '...'}${hint}`
}
