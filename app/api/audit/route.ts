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
        const pageSize = parseInt(searchParams.get('pageSize') ?? '25')
        const action = searchParams.get('action')

        const where: Record<string, unknown> = { tenantId }
        if (action) where.action = action

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { user: { select: { id: true, name: true } } },
            }),
            prisma.auditLog.count({ where }),
        ])

        return NextResponse.json(successResponse(logs, { page, pageSize, total }, tenantId))
    } catch (error) {
        console.error('[API] GET /api/audit error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch audit logs'), { status: 500 })
    }
}
