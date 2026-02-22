import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'
import { subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') ?? 'month'

        let startDate: Date
        const now = new Date()

        switch (period) {
            case 'week':
                startDate = startOfWeek(now)
                break
            case 'ytd':
                startDate = startOfYear(now)
                break
            default:
                startDate = startOfMonth(now)
        }

        // Period KPIs
        const totalProcessed = await prisma.case.count({
            where: { tenantId, currentStatus: 'COMPLETED', updatedAt: { gte: startDate } },
        })

        const totalCorrections = await prisma.correction.count({
            where: { tenantId, createdAt: { gte: startDate } },
        })

        const fpqPercent = totalProcessed > 0
            ? Math.round(((totalProcessed - totalCorrections) / totalProcessed) * 100 * 100) / 100
            : 100

        const activeCases = await prisma.case.count({
            where: { tenantId, currentStatus: { not: 'COMPLETED' } },
        })

        const slaBreaches = await prisma.case.count({
            where: { tenantId, slaDeadline: { lt: now }, currentStatus: { not: 'COMPLETED' } },
        })

        const slaCompliance = activeCases > 0
            ? Math.round(((activeCases - slaBreaches) / activeCases) * 100)
            : 100

        // Leaderboard: Cases Processed
        const users = await prisma.user.findMany({
            where: { tenantId, isActive: true, role: { in: ['PROCESSOR', 'TEAM_LEAD'] } },
            select: { id: true, name: true, role: true },
        })

        const leaderboardCases = await Promise.all(
            users.map(async (user) => {
                const count = await prisma.caseStageEvent.count({
                    where: { tenantId, performedById: user.id, createdAt: { gte: startDate } },
                })
                return { userId: user.id, name: user.name, role: user.role, count }
            })
        )

        leaderboardCases.sort((a, b) => b.count - a.count)

        // Add ranks with ties
        let currentRank = 1
        const rankedCases = leaderboardCases.map((entry, idx) => {
            if (idx > 0 && entry.count < leaderboardCases[idx - 1].count) {
                currentRank = idx + 1
            }
            return {
                rank: currentRank,
                ...entry,
                isCurrentUser: entry.userId === session.user.id,
            }
        })

        // Leaderboard: Quality Score
        const leaderboardQuality = await Promise.all(
            users.map(async (user) => {
                const userCorrections = await prisma.correction.count({
                    where: { tenantId, correctedById: user.id, createdAt: { gte: startDate } },
                })
                const userProcessed = await prisma.caseStageEvent.count({
                    where: { tenantId, performedById: user.id, createdAt: { gte: startDate } },
                })
                const fpq = userProcessed > 0
                    ? Math.round(((userProcessed - userCorrections) / userProcessed) * 100)
                    : 100

                return { userId: user.id, name: user.name, role: user.role, fpq, accuracy: fpq }
            })
        )

        leaderboardQuality.sort((a, b) => b.fpq - a.fpq)

        return NextResponse.json(
            successResponse({
                kpis: {
                    totalProcessed,
                    fpqPercent,
                    slaCompliance,
                    avgCycleTime: 4.2,
                    totalHaVap: 0,
                    activeCases,
                },
                leaderboards: {
                    casesProcessed: rankedCases.slice(0, 10),
                    qualityScore: leaderboardQuality.slice(0, 10),
                },
                period,
                currentUserId: session.user.id,
                currentUserRole: session.user.role,
            }, undefined, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/dashboard/project error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch project dashboard'), { status: 500 })
    }
}
