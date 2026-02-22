import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

const STAGES = ['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED'] as const
const LIMIT_PER_STAGE = 100

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const now = new Date()

        const casesByStage: Record<string, Array<Record<string, unknown>>> = {}
        for (const stage of STAGES) {
            const list = await prisma.case.findMany({
                where: { tenantId, currentStage: stage },
                orderBy: [{ slaRiskScore: 'desc' }, { slaDeadline: 'asc' }],
                take: LIMIT_PER_STAGE,
                select: {
                    id: true,
                    referenceId: true,
                    caseNumber: true,
                    productName: true,
                    country: true,
                    reportType: true,
                    seriousness: true,
                    haVapIndicator: true,
                    isPregnancy: true,
                    currentStage: true,
                    slaDeadline: true,
                    slaRiskScore: true,
                    allocations: {
                        where: { isActive: true },
                        take: 1,
                        include: { assignedTo: { select: { id: true, name: true } } },
                    },
                },
            })
            casesByStage[stage] = list.map((c) => ({
                ...c,
                slaDeadline: c.slaDeadline.toISOString(),
                daysLeft: Math.ceil((c.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                assignedTo: c.allocations[0]?.assignedTo ?? null,
            }))
        }

        return NextResponse.json(successResponse({ stages: STAGES, casesByStage }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/pipeline error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch pipeline'), { status: 500 })
    }
}
