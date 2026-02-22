import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { StageAdvanceSchema, successResponse, errorResponse } from '@/types'

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
        const data = StageAdvanceSchema.parse(body)

        const existingCase = await prisma.case.findFirst({
            where: { id: caseId, tenantId },
        })

        if (!existingCase) {
            return NextResponse.json(errorResponse('NOT_FOUND', 'Case not found'), { status: 404 })
        }

        // Create stage event
        const stageEvent = await prisma.caseStageEvent.create({
            data: {
                tenantId,
                caseId,
                fromStage: existingCase.currentStage,
                toStage: data.toStage,
                performedById: session.user.id,
                notes: data.notes,
                clockStop: data.clockStop,
                clockResume: data.clockResume,
            },
        })

        // Update case current stage
        const updateData: Record<string, unknown> = {
            currentStage: data.toStage,
        }

        if (data.toStage === 'COMPLETED') {
            updateData.currentStatus = 'COMPLETED'
        } else if (existingCase.currentStatus === 'ALLOCATED') {
            updateData.currentStatus = 'IN_PROGRESS'
        }

        await prisma.case.update({
            where: { id: caseId },
            data: updateData,
        })

        await logAudit({
            tenantId,
            userId: session.user.id,
            action: AuditActions.CASE_STAGE_ADVANCED,
            entityType: 'Case',
            entityId: caseId,
            before: { stage: existingCase.currentStage },
            after: { stage: data.toStage },
            ipAddress: getClientIp(request),
            userAgent: getUserAgent(request),
        })

        return NextResponse.json(successResponse(stageEvent, undefined, tenantId))
    } catch (error) {
        console.error('[API] POST /api/cases/[id]/stage error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to advance stage'), { status: 500 })
    }
}
