import { randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { logger } from '@/lib/monitoring/logger'

const CSRF_COOKIE_NAME = '__pv_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

export function generateCSRFToken(): string {
    return randomBytes(TOKEN_LENGTH).toString('hex')
}

export async function setCSRFTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8,
    })
}

export async function validateCSRFToken(headerToken: string | null): Promise<boolean> {
    if (!headerToken) {
        logger.warn('Missing CSRF token in request header', { module: 'csrf' })
        return false
    }

    try {
        const cookieStore = await cookies()
        const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
        if (!cookieToken) {
            logger.warn('Missing CSRF cookie', { module: 'csrf' })
            return false
        }

        const headerBuf = Buffer.from(headerToken)
        const cookieBuf = Buffer.from(cookieToken)

        if (headerBuf.length !== cookieBuf.length) {
            return false
        }

        return timingSafeEqual(headerBuf, cookieBuf)
    } catch (error) {
        logger.error('CSRF validation error', error, { module: 'csrf' })
        return false
    }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME }
