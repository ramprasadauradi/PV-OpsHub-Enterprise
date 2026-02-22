import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId

        const users = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                dailyCaseLimit: true,
                createdAt: true,
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' },
            ],
        })

        return NextResponse.json(successResponse(users, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/admin/users error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch users'), { status: 500 })
    }
}
