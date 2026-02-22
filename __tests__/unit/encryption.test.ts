import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, encryptJSON, decryptJSON, generateSecureToken, hashForComparison, verifyHash } from '@/lib/security/encryption'

// Set test encryption key
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('Encryption', () => {
    describe('encrypt / decrypt', () => {
        it('should encrypt and decrypt a string correctly', () => {
            const plaintext = 'Sensitive patient data - MedDRA coded AE'
            const ciphertext = encrypt(plaintext)
            expect(ciphertext).not.toBe(plaintext)
            expect(ciphertext).toContain(':')

            const decrypted = decrypt(ciphertext)
            expect(decrypted).toBe(plaintext)
        })

        it('should produce different ciphertexts for the same plaintext', () => {
            const plaintext = 'Same input text'
            const c1 = encrypt(plaintext)
            const c2 = encrypt(plaintext)
            expect(c1).not.toBe(c2) // Different IVs
        })

        it('should fail to decrypt tampered ciphertext', () => {
            const ciphertext = encrypt('test data')
            const parts = ciphertext.split(':')
            parts[2] = 'ff' + parts[2].slice(2) // tamper encrypted data
            expect(() => decrypt(parts.join(':'))).toThrow()
        })

        it('should fail with invalid format', () => {
            expect(() => decrypt('invalid')).toThrow('Invalid ciphertext format')
        })
    })

    describe('encryptJSON / decryptJSON', () => {
        it('should handle JSON objects', () => {
            const data = { userId: 'user-123', action: 'CASE_ALLOCATED', timestamp: '2025-01-01' }
            const encrypted = encryptJSON(data)
            const decrypted = decryptJSON(encrypted)
            expect(decrypted).toEqual(data)
        })

        it('should handle nested objects', () => {
            const data = { before: { status: 'OPEN' }, after: { status: 'CLOSED' }, meta: [1, 2, 3] }
            const encrypted = encryptJSON(data)
            const decrypted = decryptJSON(encrypted)
            expect(decrypted).toEqual(data)
        })
    })

    describe('hashForComparison / verifyHash', () => {
        it('should hash and verify correctly', () => {
            const value = 'important-comparison-value'
            const hashed = hashForComparison(value)
            expect(verifyHash(value, hashed)).toBe(true)
        })

        it('should fail for wrong value', () => {
            const hashed = hashForComparison('correct')
            expect(verifyHash('wrong', hashed)).toBe(false)
        })
    })

    describe('generateSecureToken', () => {
        it('should generate hex token of correct length', () => {
            const token = generateSecureToken(32)
            expect(token).toHaveLength(64) // 32 bytes = 64 hex chars
        })

        it('should generate unique tokens', () => {
            const t1 = generateSecureToken()
            const t2 = generateSecureToken()
            expect(t1).not.toBe(t2)
        })
    })
})
