import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getUserCapacity } from '@/lib/allocation/governance'
import { successResponse, errorResponse } from '@/types'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId

        // Get all active processors and team leads
        const users = await prisma.user.findMany({
            where: {
                tenantId,
                isActive: true,
                role: { in: ['PROCESSOR', 'TEAM_LEAD'] },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                dailyCaseLimit: true,
            },
        })

        // Get capacity for each user
        const processorsWithCapacity = await Promise.all(
            users.map(async (user) => {
                const capacity = await getUserCapacity(tenantId, user.id)
                return {
                    ...user,
                    capacity,
                }
            })
        )

        return NextResponse.json(successResponse(processorsWithCapacity, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/allocation/suggest error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch processors'), { status: 500 })
    }
}
