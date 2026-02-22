import { describe, it, expect } from 'vitest'
import {
    escapeHtml,
    sanitizeString,
    sanitizeObject,
    sanitizeSQLIdentifier,
    sanitizeSearchQuery,
} from '@/lib/security/sanitization'

describe('Sanitization', () => {
    describe('escapeHtml', () => {
        it('should escape HTML entities', () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
            )
        })

        it('should handle normal text unchanged', () => {
            expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
        })
    })

    describe('sanitizeString', () => {
        it('should strip script tags', () => {
            const input = 'Normal text <script>evil()</script> more text'
            const result = sanitizeString(input)
            expect(result).not.toContain('<script>')
            expect(result).toContain('Normal text')
        })

        it('should strip javascript: URIs', () => {
            const result = sanitizeString('javascript:alert(1)')
            expect(result).not.toContain('javascript:')
        })

        it('should strip event handlers', () => {
            const result = sanitizeString('onclick="doEvil()"')
            expect(result).not.toContain('onclick')
        })

        it('should strip control characters', () => {
            const result = sanitizeString('Hello\x00World\x08')
            expect(result).toBe('HelloWorld')
        })
    })

    describe('sanitizeObject', () => {
        it('should sanitize string values in objects', () => {
            const obj = {
                name: 'Normal Name',
                bio: '<script>alert(1)</script>Bio',
                count: 42,
            }
            const sanitized = sanitizeObject(obj)
            expect(sanitized.name).toBe('Normal Name')
            expect(sanitized.bio).not.toContain('<script>')
            expect(sanitized.count).toBe(42)
        })

        it('should sanitize nested objects', () => {
            const obj = {
                data: {
                    field: '<script>evil</script>',
                },
            }
            const sanitized = sanitizeObject(obj)
            expect((sanitized.data as any).field).not.toContain('<script>')
        })

        it('should sanitize arrays', () => {
            const obj = {
                tags: ['normal', '<script>evil</script>', 'safe'],
            }
            const sanitized = sanitizeObject(obj)
            expect(sanitized.tags[1]).not.toContain('<script>')
        })
    })

    describe('sanitizeSQLIdentifier', () => {
        it('should strip non-alphanumeric chars except underscore', () => {
            expect(sanitizeSQLIdentifier('table_name')).toBe('table_name')
            expect(sanitizeSQLIdentifier('DROP TABLE;--')).toBe('DROPTABLE')
            expect(sanitizeSQLIdentifier("Robert'); DROP TABLE")).toBe('RobertDROPTABLE')
        })
    })

    describe('sanitizeSearchQuery', () => {
        it('should limit length to 200', () => {
            const long = 'a'.repeat(500)
            expect(sanitizeSearchQuery(long).length).toBeLessThanOrEqual(200)
        })

        it('should strip special search operators', () => {
            const result = sanitizeSearchQuery('test & malicious | query (injection)')
            expect(result).not.toContain('&')
            expect(result).not.toContain('|')
            expect(result).not.toContain('(')
        })
    })
})
