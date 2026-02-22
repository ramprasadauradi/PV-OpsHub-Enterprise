import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { successResponse, errorResponse } from '@/types'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const { id: caseId } = await params
        const tenantId = session.user.tenantId
        const body = await request.json()
        const { assignToUserId } = body

        if (!assignToUserId) {
            return NextResponse.json(errorResponse('BAD_REQUEST', 'assignToUserId is required'), { status: 400 })
        }

        // Import and use allocation engine
        const { allocateCase } = await import('@/lib/allocation/engine')
        const result = await allocateCase({
            tenantId,
            caseId,
            assignToUserId,
            allocatedByUserId: session.user.id,
            allocatorRole: session.user.role,
        })

        if (!result.success) {
            return NextResponse.json(errorResponse('ALLOCATION_FAILED', result.error ?? 'Allocation failed'), { status: 400 })
        }

        return NextResponse.json(successResponse(result, undefined, tenantId))
    } catch (error) {
        console.error('[API] POST /api/cases/[id]/allocate error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to allocate case'), { status: 500 })
    }
}
