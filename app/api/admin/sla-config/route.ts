import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId

        const configs = await prisma.sLAConfig.findMany({
            where: { tenantId },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        })

        return NextResponse.json(successResponse({ configs }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/admin/sla-config error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch SLA configs'), { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId
        const body = await request.json()

        const config = await prisma.sLAConfig.create({
            data: {
                tenantId,
                configName: body.configName,
                country: body.country ?? 'DEFAULT',
                licensePartner: body.licensePartner ?? 'DEFAULT',
                reportType: body.reportType ?? 'ALL',
                seriousness: body.seriousness ?? 'ALL',
                haVapIndicator: body.haVapIndicator ?? 'ALL',
                submissionDays: body.submissionDays,
                useBusinessDays: body.useBusinessDays ?? false,
                clockStopAllowed: body.clockStopAllowed ?? true,
                maxClockStops: body.maxClockStops ?? 3,
                priority: body.priority ?? 0,
                effectiveDate: new Date(body.effectiveDate ?? new Date()),
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
                notes: body.notes,
            },
        })

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'SLA_CONFIG_CREATED',
                entityType: 'SLAConfig',
                entityId: config.id,
                after: config as object,
            },
        })

        return NextResponse.json(successResponse({ config }, undefined, tenantId))
    } catch (error) {
        console.error('[API] POST /api/admin/sla-config error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to create SLA config'), { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId
        const body = await request.json()
        const { id, ...updates } = body

        // Expire old rule
        await prisma.sLAConfig.update({
            where: { id },
            data: { expiryDate: new Date(), isActive: false },
        })

        // Create new version
        const oldRule = await prisma.sLAConfig.findUnique({ where: { id } })
        if (!oldRule) return NextResponse.json(errorResponse('NOT_FOUND', 'Rule not found'), { status: 404 })

        const newConfig = await prisma.sLAConfig.create({
            data: {
                tenantId,
                configName: updates.configName ?? oldRule.configName,
                country: updates.country ?? oldRule.country,
                licensePartner: updates.licensePartner ?? oldRule.licensePartner,
                reportType: updates.reportType ?? oldRule.reportType,
                seriousness: updates.seriousness ?? oldRule.seriousness,
                haVapIndicator: updates.haVapIndicator ?? oldRule.haVapIndicator,
                submissionDays: updates.submissionDays ?? oldRule.submissionDays,
                useBusinessDays: updates.useBusinessDays ?? oldRule.useBusinessDays,
                clockStopAllowed: updates.clockStopAllowed ?? oldRule.clockStopAllowed,
                maxClockStops: updates.maxClockStops ?? oldRule.maxClockStops,
                priority: updates.priority ?? oldRule.priority,
                effectiveDate: new Date(),
                version: oldRule.version + 1,
                notes: updates.notes ?? oldRule.notes,
            },
        })

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'SLA_CONFIG_UPDATED',
                entityType: 'SLAConfig',
                entityId: newConfig.id,
                before: oldRule as object,
                after: newConfig as object,
            },
        })

        return NextResponse.json(successResponse({ config: newConfig }, undefined, tenantId))
    } catch (error) {
        console.error('[API] PATCH /api/admin/sla-config error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to update SLA config'), { status: 500 })
    }
}
