import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/prisma'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: Role
            tenantId: string
            tenantName: string
            timezone: string
        }
    }
    interface User {
        role: Role
        tenantId: string
        tenantName: string
        timezone: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: Role
        tenantId: string
        tenantName: string
        timezone: string
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                const email = (credentials.email as string).trim().toLowerCase()
                const password = (credentials.password as string).trim()

                const user = await prisma.user.findFirst({
                    where: {
                        email,
                        isActive: true,
                    },
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                isActive: true,
                            },
                        },
                    },
                })

                if (!user || !user.tenant.isActive) {
                    throw new Error('Invalid credentials or inactive account')
                }

                const isPasswordValid = await compare(password, user.passwordHash)
                if (!isPasswordValid) {
                    throw new Error('Invalid credentials')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant.name,
                    timezone: user.timezone,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
                token.role = user.role
                token.tenantId = user.tenantId
                token.tenantName = user.tenantName
                token.timezone = user.timezone
            }
            return token
        },
        async session({ session, token }) {
            session.user.id = token.id
            session.user.role = token.role
            session.user.tenantId = token.tenantId
            session.user.tenantName = token.tenantName
            session.user.timezone = token.timezone
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
})

// RBAC role hierarchy
const ROLE_HIERARCHY: Record<Role, number> = {
    SUPER_ADMIN: 100,
    TENANT_ADMIN: 90,
    PROJECT_MANAGER: 70,
    QUALITY_MANAGER: 70,
    OPS_MANAGER: 70,
    TEAM_LEAD: 50,
    PROCESSOR: 10,
}

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessRoute(userRole: Role, route: string): boolean {
    const adminRoutes = ['/admin']
    const managerRoutes = ['/dashboard/manager']
    const auditRoutes = ['/audit']

    if (adminRoutes.some((r) => route.startsWith(r))) {
        return hasMinRole(userRole, 'TENANT_ADMIN')
    }
    if (managerRoutes.some((r) => route.startsWith(r))) {
        return hasMinRole(userRole, 'TEAM_LEAD')
    }
    if (auditRoutes.some((r) => route.startsWith(r))) {
        return ['TENANT_ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER'].includes(userRole)
    }
    return true
}

export type { Role }
