import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { successResponse, errorResponse } from '@/types'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                holdAutoReleaseHours: true,
                maxReassignments: true,
                capaThreshold: true,
                fpqMinThreshold: true,
            },
        })

        return NextResponse.json(successResponse({
            holdAutoReleaseHours: tenant?.holdAutoReleaseHours ?? 24,
            maxReassignments: tenant?.maxReassignments ?? 3,
            capaThreshold: tenant?.capaThreshold ?? 5,
            fpqMinThreshold: tenant?.fpqMinThreshold ?? 95.0,
            defaultDailyCaseLimit: 10,
            haPriorityMultiplier: 1.5,
        }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/admin/governance error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch governance settings'), { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        if (!['TENANT_ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'].includes(session.user.role)) {
            return NextResponse.json(errorResponse('FORBIDDEN', 'Only admins can update governance settings'), { status: 403 })
        }

        const tenantId = session.user.tenantId
        const body = await request.json()

        const before = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { holdAutoReleaseHours: true, maxReassignments: true, capaThreshold: true, fpqMinThreshold: true },
        })

        const updateData: Record<string, number> = {}
        if (body.holdAutoReleaseHours != null) updateData.holdAutoReleaseHours = Number(body.holdAutoReleaseHours)
        if (body.maxReassignments != null) updateData.maxReassignments = Number(body.maxReassignments)
        if (body.capaThreshold != null) updateData.capaThreshold = Number(body.capaThreshold)
        if (body.fpqMinThreshold != null) updateData.fpqMinThreshold = Number(body.fpqMinThreshold)

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
        })

        await logAudit({
            tenantId,
            userId: session.user.id,
            action: AuditActions.CONFIG_CHANGED_GOVERNANCE,
            entityType: 'Tenant',
            entityId: tenantId,
            before,
            after: updateData,
            ipAddress: getClientIp(request),
            userAgent: getUserAgent(request),
        })

        return NextResponse.json(successResponse(updated, undefined, tenantId))
    } catch (error) {
        console.error('[API] PUT /api/admin/governance error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to update governance settings'), { status: 500 })
    }
}
