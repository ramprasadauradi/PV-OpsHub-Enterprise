type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
    tenantId?: string
    userId?: string
    requestId?: string
    module?: string
    [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
}

function getMinLevel(): number {
    const envLevel = (process.env.LOG_LEVEL || 'info') as LogLevel
    return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info
}

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= getMinLevel()
}

function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
        const sensitivePatterns = [
            /password/i,
            /secret/i,
            /token/i,
            /authorization/i,
            /cookie/i,
            /ssn/i,
            /creditcard/i,
        ]
        for (const pattern of sensitivePatterns) {
            if (pattern.test(value)) {
                return '[REDACTED]'
            }
        }
    }
    return value
}

function sanitizeContext(ctx: LogContext): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(ctx)) {
        const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'cookie', 'passwordHash']
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]'
        } else {
            sanitized[key] = sanitizeValue(value)
        }
    }
    return sanitized
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(context ? sanitizeContext(context) : {}),
        pid: process.pid,
        env: process.env.NODE_ENV || 'development',
    }

    if (process.env.NODE_ENV === 'production') {
        return JSON.stringify(entry)
    }

    const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
    }
    const reset = '\x1b[0m'
    const color = levelColors[level]
    const contextStr = context ? ` ${JSON.stringify(sanitizeContext(context))}` : ''
    return `${color}[${level.toUpperCase()}]${reset} ${entry.timestamp} ${message}${contextStr}`
}

export const logger = {
    debug(message: string, context?: LogContext): void {
        if (shouldLog('debug')) {
            process.stdout.write(formatLog('debug', message, context) + '\n')
        }
    },

    info(message: string, context?: LogContext): void {
        if (shouldLog('info')) {
            process.stdout.write(formatLog('info', message, context) + '\n')
        }
    },

    warn(message: string, context?: LogContext): void {
        if (shouldLog('warn')) {
            process.stderr.write(formatLog('warn', message, context) + '\n')
        }
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        if (shouldLog('error')) {
            const errorContext: LogContext = {
                ...context,
                ...(error instanceof Error
                    ? {
                        errorName: error.name,
                        errorMessage: error.message,
                        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
                    }
                    : { errorRaw: String(error) }),
            }
            process.stderr.write(formatLog('error', message, errorContext) + '\n')
        }
    },

    child(baseContext: LogContext) {
        return {
            debug: (message: string, context?: LogContext) =>
                logger.debug(message, { ...baseContext, ...context }),
            info: (message: string, context?: LogContext) =>
                logger.info(message, { ...baseContext, ...context }),
            warn: (message: string, context?: LogContext) =>
                logger.warn(message, { ...baseContext, ...context }),
            error: (message: string, error?: Error | unknown, context?: LogContext) =>
                logger.error(message, error, { ...baseContext, ...context }),
        }
    },
}
