import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bulkAllocate } from '@/lib/allocation/engine'
import { AllocationSchema, successResponse, errorResponse } from '@/types'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const body = await request.json()
        const data = AllocationSchema.parse(body)
        const tenantId = session.user.tenantId

        const result = await bulkAllocate(
            tenantId,
            data.caseIds,
            data.assignToUserId,
            session.user.id,
            session.user.role
        )

        return NextResponse.json(successResponse(result, undefined, tenantId))
    } catch (error) {
        console.error('[API] POST /api/allocation/bulk error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Bulk allocation failed'), { status: 500 })
    }
}
