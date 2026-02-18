import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32
const AUTH_TAG_LENGTH = 16
const PAYLOAD_VERSION = 'v1'

function getMasterKey(): Buffer {
  const raw = process.env.WORKSPACE_SECRETS_MASTER_KEY
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    throw new Error(
      'WORKSPACE_SECRETS_MASTER_KEY must be set for workspace secrets encryption'
    )
  }
  const trimmed = raw.trim()
  if (trimmed.length === KEY_LENGTH * 2 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex')
  }
  if (Buffer.byteLength(trimmed, 'utf8') === KEY_LENGTH) {
    return Buffer.from(trimmed, 'utf8')
  }
  return createHash('sha256').update(trimmed, 'utf8').digest()
}

/**
 * Encrypts a plaintext secret for storage. Only the resulting string should be
 * persisted; never store or log the plaintext.
 * Payload format: v1:<base64(iv)>:<base64(tag)>:<base64(ciphertext)>
 */
export function encryptSecret(plaintext: string): string {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  const ivB64 = iv.toString('base64url')
  const tagB64 = tag.toString('base64url')
  const ctB64 = encrypted.toString('base64url')
  return `${PAYLOAD_VERSION}:${ivB64}:${tagB64}:${ctB64}`
}

/**
 * Decrypts a payload produced by encryptSecret. Call only in server runtime;
 * never send decrypted values to the client or log them.
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== PAYLOAD_VERSION) {
    throw new Error('Invalid or unsupported workspace secret payload')
  }
  const [, ivB64, tagB64, ctB64] = parts
  const key = getMasterKey()
  const iv = Buffer.from(ivB64, 'base64url')
  const tag = Buffer.from(tagB64, 'base64url')
  const ciphertext = Buffer.from(ctB64, 'base64url')
  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid workspace secret payload format')
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(tag)
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8')
}
