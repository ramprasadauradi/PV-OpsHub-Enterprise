import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const { id } = await params
        const tenantId = session.user.tenantId

        const caseData = await prisma.case.findFirst({
            where: { id, tenantId },
            include: {
                allocations: {
                    orderBy: { allocatedAt: 'desc' },
                    include: {
                        assignedTo: { select: { id: true, name: true, email: true, role: true } },
                        allocatedBy: { select: { id: true, name: true, role: true } },
                    },
                },
                stageEvents: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        performedBy: { select: { id: true, name: true } },
                    },
                },
                corrections: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        correctedBy: { select: { id: true, name: true } },
                    },
                },
                holdEvents: {
                    orderBy: { heldAt: 'desc' },
                },
            },
        })

        if (!caseData) {
            return NextResponse.json(errorResponse('NOT_FOUND', 'Case not found'), { status: 404 })
        }

        // Fetch audit trail for this case
        const auditTrail = await prisma.auditLog.findMany({
            where: { tenantId, entityType: 'Case', entityId: id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json(successResponse({ ...caseData, auditTrail }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/cases/[id] error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch case'), { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const { id } = await params
        const tenantId = session.user.tenantId
        const body = await request.json()

        const existingCase = await prisma.case.findFirst({
            where: { id, tenantId },
        })

        if (!existingCase) {
            return NextResponse.json(errorResponse('NOT_FOUND', 'Case not found'), { status: 404 })
        }

        const updated = await prisma.case.update({
            where: { id },
            data: body,
        })

        return NextResponse.json(successResponse(updated, undefined, tenantId))
    } catch (error) {
        console.error('[API] PATCH /api/cases/[id] error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to update case'), { status: 500 })
    }
}
