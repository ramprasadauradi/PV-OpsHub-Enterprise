import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { logger } from '@/lib/monitoring/logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16
const ENCODING = 'hex' as const
const SEPARATOR = ':'

function getKey(): Buffer {
    const hexKey = process.env.ENCRYPTION_KEY
    if (!hexKey || hexKey.length !== 64) {
        throw new Error(
            'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got: ' +
            (hexKey ? hexKey.length : 'undefined')
        )
    }
    return Buffer.from(hexKey, 'hex')
}

function getPreviousKey(): Buffer | null {
    const hexKey = process.env.ENCRYPTION_KEY_PREV
    if (!hexKey || hexKey.length !== 64) return null
    return Buffer.from(hexKey, 'hex')
}

export function encrypt(plaintext: string): string {
    const key = getKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING)
    encrypted += cipher.final(ENCODING)
    const authTag = cipher.getAuthTag()

    return [iv.toString(ENCODING), authTag.toString(ENCODING), encrypted].join(SEPARATOR)
}

export function decrypt(ciphertext: string): string {
    const parts = ciphertext.split(SEPARATOR)
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format')
    }

    const [ivHex, tagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, ENCODING)
    const tag = Buffer.from(tagHex, ENCODING)

    // Try current key first
    try {
        const key = getKey()
        const decipher = createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(tag)

        let decrypted = decipher.update(encryptedHex, ENCODING, 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    } catch {
        // Try previous key for rotation
        const prevKey = getPreviousKey()
        if (!prevKey) throw new Error('Decryption failed — no previous key available for rotation')

        try {
            const decipher = createDecipheriv(ALGORITHM, prevKey, iv)
            decipher.setAuthTag(tag)

            let decrypted = decipher.update(encryptedHex, ENCODING, 'utf8')
            decrypted += decipher.final('utf8')

            logger.warn('Decrypted using previous key — re-encryption recommended', {
                module: 'encryption',
            })
            return decrypted
        } catch {
            throw new Error('Decryption failed with both current and previous keys')
        }
    }
}

export function encryptJSON(data: object): string {
    return encrypt(JSON.stringify(data))
}

export function decryptJSON<T>(ciphertext: string): T {
    const json = decrypt(ciphertext)
    return JSON.parse(json) as T
}

export function hashForComparison(value: string, salt?: string): string {
    const useSalt = salt ?? randomBytes(16).toString('hex')
    const hash = scryptSync(value, useSalt, 64).toString('hex')
    return `${useSalt}:${hash}`
}

export function verifyHash(value: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const computed = scryptSync(value, salt, 64).toString('hex')
    return computed === hash
}

export function generateSecureToken(lengthBytes: number = 32): string {
    return randomBytes(lengthBytes).toString('hex')
}
