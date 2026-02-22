import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { CorrectionSchema, successResponse, errorResponse } from '@/types'

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
        const data = CorrectionSchema.parse({ ...body, caseId })

        // Create correction
        const correction = await prisma.correction.create({
            data: {
                tenantId,
                caseId,
                correctedById: session.user.id,
                stage: data.stage,
                category: data.category,
                description: data.description,
            },
        })

        // CAPA Auto-Trigger Logic
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { capaThreshold: true },
        })

        const recentCorrections = await prisma.correction.count({
            where: {
                tenantId,
                correctedById: session.user.id,
                category: data.category,
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        })

        let capaTriggered = false
        if (tenant && recentCorrections >= tenant.capaThreshold) {
            // Auto-create CAPA record
            const capa = await prisma.cAPARecord.create({
                data: {
                    tenantId,
                    triggeredById: session.user.id,
                    triggerCategory: data.category,
                    description: `Auto-triggered CAPA: ${recentCorrections} ${data.category} corrections in last 30 days by user`,
                },
            })

            // Link correction to CAPA
            await prisma.correction.update({
                where: { id: correction.id },
                data: { capaTriggered: true, capaId: capa.id },
            })

            capaTriggered = true

            await logAudit({
                tenantId,
                userId: session.user.id,
                action: AuditActions.CAPA_TRIGGERED,
                entityType: 'CAPARecord',
                entityId: capa.id,
                metadata: {
                    correctionCount: recentCorrections,
                    category: data.category,
                    threshold: tenant.capaThreshold,
                },
                ipAddress: getClientIp(request),
                userAgent: getUserAgent(request),
            })
        }

        await logAudit({
            tenantId,
            userId: session.user.id,
            action: AuditActions.CORRECTION_LOGGED,
            entityType: 'Correction',
            entityId: correction.id,
            after: { caseId, category: data.category, description: data.description },
            ipAddress: getClientIp(request),
            userAgent: getUserAgent(request),
        })

        return NextResponse.json(
            successResponse({ ...correction, capaTriggered }, undefined, tenantId),
            { status: 201 }
        )
    } catch (error) {
        console.error('[API] POST /api/cases/[id]/corrections error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to log correction'), { status: 500 })
    }
}
