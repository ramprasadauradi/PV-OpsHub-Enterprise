import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { HoldSchema, successResponse, errorResponse } from '@/types'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId

        const activeHolds = await prisma.holdEvent.findMany({
            where: { tenantId, releasedAt: null },
            orderBy: { heldAt: 'desc' },
            include: {
                case: { select: { id: true, referenceId: true, caseNumber: true } },
                initiatedBy: { select: { id: true, name: true } },
            },
        })

        const heldCaseCount = await prisma.case.count({
            where: { tenantId, isHeld: true },
        })

        return NextResponse.json(
            successResponse({ activeHolds, heldCaseCount }, undefined, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/allocation/hold error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch hold status'), { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        if (!['PROJECT_MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json(errorResponse('FORBIDDEN', 'Only PM can initiate holds'), { status: 403 })
        }

        const body = await request.json()
        const data = HoldSchema.parse(body)
        const tenantId = session.user.tenantId

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { holdAutoReleaseHours: true },
        })

        const autoReleaseHours = data.autoReleaseHours ?? tenant?.holdAutoReleaseHours ?? 24
        const autoReleaseAt = new Date(Date.now() + autoReleaseHours * 60 * 60 * 1000)

        if (data.holdType === 'ALL') {
            const hold = await prisma.holdEvent.create({
                data: {
                    tenantId,
                    holdType: 'ALL',
                    initiatedById: session.user.id,
                    autoReleaseAt,
                    notes: data.notes,
                },
            })

            // Mark all unallocated cases as held
            await prisma.case.updateMany({
                where: { tenantId, currentStatus: 'UNALLOCATED' },
                data: { isHeld: true, heldAt: new Date(), holdReason: data.notes ?? 'PM Hold' },
            })

            await logAudit({
                tenantId,
                userId: session.user.id,
                action: AuditActions.HOLD_INITIATED,
                entityType: 'HoldEvent',
                entityId: hold.id,
                after: { holdType: 'ALL', autoReleaseAt },
                ipAddress: getClientIp(request),
                userAgent: getUserAgent(request),
            })

            return NextResponse.json(successResponse(hold, undefined, tenantId), { status: 201 })
        } else {
            const caseIds = data.caseIds ?? []
            const holds = []

            for (const caseId of caseIds) {
                const hold = await prisma.holdEvent.create({
                    data: {
                        tenantId,
                        caseId,
                        holdType: 'SPECIFIC',
                        initiatedById: session.user.id,
                        autoReleaseAt,
                        notes: data.notes,
                    },
                })

                await prisma.case.update({
                    where: { id: caseId },
                    data: { isHeld: true, heldAt: new Date(), holdReason: data.notes ?? 'PM Hold' },
                })

                holds.push(hold)
            }

            await logAudit({
                tenantId,
                userId: session.user.id,
                action: AuditActions.HOLD_INITIATED,
                entityType: 'HoldEvent',
                entityId: holds[0]?.id ?? '',
                after: { holdType: 'SPECIFIC', caseIds, autoReleaseAt },
                ipAddress: getClientIp(request),
                userAgent: getUserAgent(request),
            })

            return NextResponse.json(successResponse(holds, undefined, tenantId), { status: 201 })
        }
    } catch (error) {
        console.error('[API] POST /api/allocation/hold error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to initiate hold'), { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const body = await request.json()
        const { holdId, action: holdAction } = body
        const tenantId = session.user.tenantId

        if (holdAction === 'release') {
            const hold = await prisma.holdEvent.update({
                where: { id: holdId },
                data: {
                    releasedAt: new Date(),
                    releaseMethod: 'MANUAL',
                },
            })

            // Release cases
            if (hold.holdType === 'ALL') {
                await prisma.case.updateMany({
                    where: { tenantId, isHeld: true },
                    data: { isHeld: false, heldAt: null, holdReason: null },
                })
            } else if (hold.caseId) {
                await prisma.case.update({
                    where: { id: hold.caseId },
                    data: { isHeld: false, heldAt: null, holdReason: null },
                })
            }

            await logAudit({
                tenantId,
                userId: session.user.id,
                action: AuditActions.HOLD_RELEASED,
                entityType: 'HoldEvent',
                entityId: holdId,
                after: { releaseMethod: 'MANUAL' },
                ipAddress: getClientIp(request),
                userAgent: getUserAgent(request),
            })

            return NextResponse.json(successResponse(hold, undefined, tenantId))
        }

        return NextResponse.json(errorResponse('BAD_REQUEST', 'Invalid action'), { status: 400 })
    } catch (error) {
        console.error('[API] PATCH /api/allocation/hold error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to release hold'), { status: 500 })
    }
}
