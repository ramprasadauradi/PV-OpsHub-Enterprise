import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'
import { DEFAULT_STAGES, invalidateCache } from '@/lib/workflow/engine'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId

        const configs = await prisma.workflowConfig.findMany({
            where: { tenantId },
            orderBy: { stageOrder: 'asc' },
        })

        const stages = configs.length > 0
            ? configs
            : DEFAULT_STAGES.map((s, i) => ({ id: `default-${i}`, tenantId, ...s, createdAt: new Date(), updatedAt: new Date() }))

        return NextResponse.json(successResponse({ stages }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/admin/workflow error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch workflow config'), { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId
        const body = await request.json()

        if (body.action === 'reset') {
            // Delete existing configs and recreate defaults
            await prisma.workflowConfig.deleteMany({ where: { tenantId } })
            await prisma.workflowConfig.createMany({
                data: DEFAULT_STAGES.map(s => ({ tenantId, ...s })),
            })
            invalidateCache(tenantId)

            const stages = await prisma.workflowConfig.findMany({
                where: { tenantId },
                orderBy: { stageOrder: 'asc' },
            })
            return NextResponse.json(successResponse({ stages }, undefined, tenantId))
        }

        if (body.action === 'reorder') {
            // Reorder stages
            const updates = body.stages as Array<{ id: string; stageOrder: number }>
            for (const u of updates) {
                await prisma.workflowConfig.update({
                    where: { id: u.id },
                    data: { stageOrder: u.stageOrder },
                })
            }
            invalidateCache(tenantId)

            const stages = await prisma.workflowConfig.findMany({
                where: { tenantId },
                orderBy: { stageOrder: 'asc' },
            })
            return NextResponse.json(successResponse({ stages }, undefined, tenantId))
        }

        // Add new stage
        const maxOrder = await prisma.workflowConfig.aggregate({
            where: { tenantId },
            _max: { stageOrder: true },
        })

        const stage = await prisma.workflowConfig.create({
            data: {
                tenantId,
                stageCode: body.stageCode,
                stageLabel: body.stageLabel,
                stageOrder: (maxOrder._max.stageOrder ?? 0) + 1,
                isEnabled: body.isEnabled ?? true,
                color: body.color ?? '#6b7280',
                slaDays: body.slaDays ?? null,
                isRequired: body.isRequired ?? false,
                description: body.description ?? null,
            },
        })

        invalidateCache(tenantId)

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'WORKFLOW_STAGE_ADDED',
                entityType: 'WorkflowConfig',
                entityId: stage.id,
                after: stage as object,
            },
        })

        return NextResponse.json(successResponse({ stage }, undefined, tenantId))
    } catch (error) {
        console.error('[API] POST /api/admin/workflow error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to update workflow'), { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId
        const body = await request.json()
        const { id, ...updates } = body

        const before = await prisma.workflowConfig.findUnique({ where: { id } })
        const stage = await prisma.workflowConfig.update({
            where: { id },
            data: updates,
        })

        invalidateCache(tenantId)

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'WORKFLOW_STAGE_UPDATED',
                entityType: 'WorkflowConfig',
                entityId: stage.id,
                before: before as object,
                after: stage as object,
            },
        })

        return NextResponse.json(successResponse({ stage }, undefined, tenantId))
    } catch (error) {
        console.error('[API] PATCH /api/admin/workflow error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to update workflow stage'), { status: 500 })
    }
}
