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

        // Same as TL but team-aggregated
        const teamLeads = await prisma.user.findMany({
            where: { tenantId, role: 'TEAM_LEAD', isActive: true },
            select: { id: true, name: true },
        })

        const teamsData = await Promise.all(
            teamLeads.map(async (tl) => {
                const teamMembers = await prisma.user.findMany({
                    where: { tenantId, isActive: true, role: 'PROCESSOR' },
                    select: { id: true },
                })
                const memberIds = teamMembers.map((m) => m.id)

                const allocated = await prisma.case.count({
                    where: { tenantId, assignedToId: { in: memberIds }, currentStatus: { in: ['ALLOCATED', 'IN_PROGRESS'] } },
                })

                const completed = await prisma.case.count({
                    where: { tenantId, assignedToId: { in: memberIds }, currentStatus: 'COMPLETED' },
                })

                const corrections = await prisma.correction.count({
                    where: { tenantId, correctedById: { in: memberIds } },
                })

                return {
                    teamLead: tl,
                    memberCount: memberIds.length,
                    allocated,
                    completed,
                    corrections,
                    fpq: completed > 0 ? Math.round(((completed - corrections) / completed) * 100) : 100,
                }
            })
        )

        // Overall metrics
        const totalCases = await prisma.case.count({ where: { tenantId, currentStatus: { not: 'COMPLETED' } } })
        const totalCompleted = await prisma.case.count({ where: { tenantId, currentStatus: 'COMPLETED' } })

        return NextResponse.json(
            successResponse({ teams: teamsData, totalActive: totalCases, totalCompleted }, undefined, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/dashboard/manager error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch manager dashboard'), { status: 500 })
    }
}
