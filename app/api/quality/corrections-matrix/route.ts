import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

const CATEGORIES = ['DATA_ENTRY', 'CODING', 'NARRATIVE', 'DUPLICATE', 'MISSING_FOLLOWUP', 'SLA_MISS', 'MR_RETURN'] as const

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId

        const corrections = await prisma.correction.groupBy({
            by: ['correctedById', 'category'],
            where: { tenantId },
            _count: { id: true },
        })

        const userNames = await prisma.user.findMany({
            where: { tenantId, role: 'PROCESSOR', isActive: true },
            select: { id: true, name: true },
        })
        const nameMap = Object.fromEntries(userNames.map((u) => [u.id, u.name ?? u.id]))

        const userIds = [...new Set(corrections.map((c) => c.correctedById))]
        const matrix: Array<{ userId: string; userName: string; category: string; count: number }> = []
        for (const userId of userIds) {
            for (const category of CATEGORIES) {
                const row = corrections.find((c) => c.correctedById === userId && c.category === category)
                matrix.push({
                    userId,
                    userName: nameMap[userId] ?? userId,
                    category,
                    count: row?._count.id ?? 0,
                })
            }
        }

        return NextResponse.json(
            successResponse({
                matrix,
                rows: userIds.map((id) => ({ id, name: nameMap[id] ?? id })),
                cols: [...CATEGORIES],
            }, undefined, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/quality/corrections-matrix error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch corrections matrix'), { status: 500 })
    }
}
