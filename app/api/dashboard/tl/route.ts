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
        const now = new Date()

        // Allocation Status
        const [totalAllocated, totalUnallocated] = await Promise.all([
            prisma.case.count({ where: { tenantId, currentStatus: { in: ['ALLOCATED', 'IN_PROGRESS'] } } }),
            prisma.case.count({ where: { tenantId, currentStatus: 'UNALLOCATED' } }),
        ])

        // HA/VAP counts
        const [haCount, vapCount, neitherCount] = await Promise.all([
            prisma.case.count({ where: { tenantId, haVapIndicator: 'HA', currentStatus: { not: 'COMPLETED' } } }),
            prisma.case.count({ where: { tenantId, haVapIndicator: 'VAP', currentStatus: { not: 'COMPLETED' } } }),
            prisma.case.count({ where: { tenantId, haVapIndicator: 'NEITHER', currentStatus: { not: 'COMPLETED' } } }),
        ])

        // Aging buckets
        const activeCases = await prisma.case.findMany({
            where: { tenantId, currentStatus: { not: 'COMPLETED' } },
            select: { id: true, slaDeadline: true, currentStage: true, slaRiskScore: true },
        })

        const agingBuckets = { '0-1': 0, '2-3': 0, '4-5': 0, '>5': 0 }
        activeCases.forEach((c) => {
            const days = Math.ceil((now.getTime() - c.slaDeadline.getTime()) / (1000 * 60 * 60 * 24))
            const daysActive = Math.max(0, -days) // Days from deadline = positive means remaining
            const daysElapsed = Math.ceil((now.getTime() - c.slaDeadline.getTime() + (c.slaRiskScore * 86400000 / 100)) / 86400000)
            if (daysElapsed <= 1) agingBuckets['0-1']++
            else if (daysElapsed <= 3) agingBuckets['2-3']++
            else if (daysElapsed <= 5) agingBuckets['4-5']++
            else agingBuckets['>5']++
        })

        // Quality - FPQ%
        const totalProcessed = await prisma.case.count({
            where: { tenantId, currentStatus: 'COMPLETED' },
        })
        const totalCorrections = await prisma.correction.count({
            where: { tenantId },
        })
        const fpqPercent = totalProcessed > 0
            ? Math.round(((totalProcessed - totalCorrections) / totalProcessed) * 100 * 100) / 100
            : 100

        // Productivity
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const processedToday = await prisma.caseStageEvent.count({
            where: { tenantId, createdAt: { gte: todayStart } },
        })

        // Hold status
        const activeHolds = await prisma.holdEvent.findMany({
            where: { tenantId, releasedAt: null },
            include: { case: { select: { id: true, referenceId: true } } },
        })
        const heldCaseCount = await prisma.case.count({
            where: { tenantId, isHeld: true },
        })

        // Unallocated cases sorted by risk
        const unallocatedCases = await prisma.case.findMany({
            where: { tenantId, currentStatus: 'UNALLOCATED' },
            orderBy: { slaRiskScore: 'desc' },
            take: 20,
        })

        // HA/VAP cases
        const haVapCases = await prisma.case.findMany({
            where: {
                tenantId,
                haVapIndicator: { in: ['HA', 'VAP'] },
                currentStatus: { not: 'COMPLETED' },
            },
            orderBy: { slaDeadline: 'asc' },
            take: 20,
        })

        return NextResponse.json(
            successResponse({
                allocation: { totalAllocated, totalUnallocated, unallocatedCases },
                havap: { haCount, vapCount, neitherCount, cases: haVapCases },
                aging: { buckets: agingBuckets },
                quality: { fpqPercent, totalCorrections, capaOpen: 0 },
                productivity: { processedToday, avgCycleTime: 4.2, reworkRate: 3.1 },
                holdStatus: { activeHolds, heldCaseCount },
            }, undefined, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/dashboard/tl error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch TL dashboard'), { status: 500 })
    }
}
