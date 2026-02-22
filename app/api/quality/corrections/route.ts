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
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') ?? '1')
        const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

        const [corrections, total] = await Promise.all([
            prisma.correction.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    case: { select: { id: true, referenceId: true, caseNumber: true } },
                    correctedBy: { select: { id: true, name: true } },
                },
            }),
            prisma.correction.count({ where: { tenantId } }),
        ])

        // CAPA records (isResolved is the status field per schema)
        const capaList = await prisma.cAPARecord.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                triggeredBy: { select: { id: true, name: true } },
            },
        })

        const capas = capaList.map((c: typeof capaList[number]) => ({
            ...c,
            status: c.isResolved ? 'RESOLVED' as const : 'OPEN' as const,
        }))

        // Summary stats
        const openCapas = await prisma.cAPARecord.count({
            where: { tenantId, isResolved: false },
        })

        return NextResponse.json(successResponse({
            corrections,
            capas,
            stats: {
                totalCorrections: total,
                openCapas,
            },
        }, { page, pageSize, total }, tenantId))
    } catch (error) {
        console.error('[API] GET /api/quality/corrections error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch corrections'), { status: 500 })
    }
}
