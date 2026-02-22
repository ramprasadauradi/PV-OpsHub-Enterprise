const HTML_ENTITY_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
}

const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["']?[^"']*["']?/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /expression\s*\(/gi,
    /eval\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript/gi,
]

export function escapeHtml(str: string): string {
    return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITY_MAP[char] || char)
}

export function sanitizeString(input: string): string {
    let sanitized = input

    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '')
    }

    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    return sanitized.trim()
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result = { ...obj }

    for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'string') {
            ; (result as Record<string, unknown>)[key] = sanitizeString(value)
        } else if (Array.isArray(value)) {
            ; (result as Record<string, unknown>)[key] = value.map((item) =>
                typeof item === 'string'
                    ? sanitizeString(item)
                    : item && typeof item === 'object'
                        ? sanitizeObject(item as Record<string, unknown>)
                        : item
            )
        } else if (value && typeof value === 'object') {
            ; (result as Record<string, unknown>)[key] = sanitizeObject(
                value as Record<string, unknown>
            )
        }
    }

    return result
}

export function sanitizeSQLIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_]/g, '')
}

export function sanitizeSearchQuery(query: string): string {
    let sanitized = sanitizeString(query)
    sanitized = sanitized.replace(/[!'&|():*~<>@]/g, ' ')
    sanitized = sanitized.replace(/\s+/g, ' ').trim()
    return sanitized.slice(0, 200)
}
