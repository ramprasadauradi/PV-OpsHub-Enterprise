import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth', '/api/health']

// Routes that require specific roles (TEAM_LEAD can access /dashboard/tl)
const ROLE_ROUTES: Record<string, string[]> = {
    '/admin': ['SUPER_ADMIN', 'TENANT_ADMIN'],
    '/dashboard/project': ['SUPER_ADMIN', 'TENANT_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'PROCESSOR'],
    '/dashboard/manager': ['SUPER_ADMIN', 'TENANT_ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'OPS_MANAGER'],
    '/dashboard/tl': ['SUPER_ADMIN', 'TENANT_ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'OPS_MANAGER', 'TEAM_LEAD'],
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // ─── Request ID ─────────────────────
    const requestId = crypto.randomUUID()
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-response-time', new Date().toISOString())

    // ─── Security Headers ──────────────
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // ─── Public Route Check ────────────
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    if (isPublic) {
        return response
    }

    // ─── API Rate Limit Headers ────────
    if (pathname.startsWith('/api/')) {
        response.headers.set('X-RateLimit-Limit', '100')
        response.headers.set('X-RateLimit-Remaining', '99')
        response.headers.set('Cache-Control', 'no-store')
    }

    // ─── Static Assets ─────────────────
    if (pathname.startsWith('/_next/') || pathname.includes('.')) {
        return response
    }

    // ─── Auth guard for protected pages ────────────
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    const role = token.role as string

    // Role-based route access
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(routePrefix) && !allowedRoles.includes(role)) {
            const redirectUrl = role === 'PROCESSOR' ? '/dashboard/project' : '/dashboard/tl'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
