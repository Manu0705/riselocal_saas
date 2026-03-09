import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const SCRYPT_KEYLEN = 64

export function hashPassword(plainText: string): string {
  const normalized = plainText.trim()
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(normalized, salt, SCRYPT_KEYLEN).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(plainText: string, encoded: string): boolean {
  const [salt, storedHash] = encoded.split(":")

  if (!salt || !storedHash) {
    return false
  }

  const computedHash = scryptSync(plainText.trim(), salt, SCRYPT_KEYLEN)
  const storedBuffer = Buffer.from(storedHash, "hex")

  if (computedHash.length !== storedBuffer.length) {
    return false
  }

  return timingSafeEqual(computedHash, storedBuffer)
}
