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
        const status = searchParams.get('status') // 'open' | 'resolved' | null (all)

        const where: Record<string, unknown> = { tenantId }
        if (status === 'open') where.isResolved = false
        if (status === 'resolved') where.isResolved = true

        const [capas, total, openCount, resolvedCount] = await Promise.all([
            prisma.cAPARecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    triggeredBy: { select: { id: true, name: true } },
                    corrections: {
                        select: { id: true, category: true, description: true },
                        take: 5,
                    },
                },
            }),
            prisma.cAPARecord.count({ where }),
            prisma.cAPARecord.count({ where: { tenantId, isResolved: false } }),
            prisma.cAPARecord.count({ where: { tenantId, isResolved: true } }),
        ])

        const data = capas.map((c: typeof capas[number]) => ({
            ...c,
            status: c.isResolved ? 'RESOLVED' as const : 'OPEN' as const,
        }))

        return NextResponse.json(successResponse({
            capas: data,
            stats: {
                total,
                open: openCount,
                resolved: resolvedCount,
            },
        }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/quality/capa error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch CAPA records'), { status: 500 })
    }
}
