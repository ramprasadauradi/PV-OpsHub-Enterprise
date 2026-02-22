import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logAudit, AuditActions, getClientIp, getUserAgent } from '@/lib/audit/logger'
import { CaseCreateSchema, CaseFilterSchema, successResponse, errorResponse } from '@/types'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())
        const filters = CaseFilterSchema.parse(params)
        const tenantId = session.user.tenantId

        const where: Record<string, unknown> = { tenantId }

        if (filters.reportType) where.reportType = filters.reportType
        if (filters.caseCategory) where.caseCategory = filters.caseCategory
        if (filters.caseComplexity) where.caseComplexity = filters.caseComplexity
        if (filters.country) where.country = filters.country
        if (filters.seriousness) where.seriousness = filters.seriousness
        if (filters.haVapIndicator) where.haVapIndicator = filters.haVapIndicator
        if (filters.currentStage) where.currentStage = filters.currentStage
        if (filters.currentStatus) where.currentStatus = filters.currentStatus
        if (filters.assigneeId) where.assignedToId = filters.assigneeId
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {
                ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
                ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
            }
        }

        const [cases, total] = await Promise.all([
            prisma.case.findMany({
                where,
                orderBy: { [filters.sortBy]: filters.sortOrder },
                skip: (filters.page - 1) * filters.pageSize,
                take: filters.pageSize,
                include: {
                    allocations: {
                        where: { isActive: true },
                        include: { assignedTo: { select: { id: true, name: true, email: true } } },
                    },
                },
            }),
            prisma.case.count({ where }),
        ])

        return NextResponse.json(
            successResponse(cases, { page: filters.page, pageSize: filters.pageSize, total }, tenantId)
        )
    } catch (error) {
        console.error('[API] GET /api/cases error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to fetch cases'), { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const body = await request.json()
        const data = CaseCreateSchema.parse(body)
        const tenantId = session.user.tenantId

        // Calculate SLA deadline (simple: MRD + 15 days default)
        const mrd = new Date(data.manufacturerReceiptDate)
        const slaDeadline = new Date(mrd)
        slaDeadline.setDate(slaDeadline.getDate() + 15)

        const newCase = await prisma.case.create({
            data: {
                tenantId,
                referenceId: data.referenceId,
                caseNumber: data.caseNumber,
                reportType: data.reportType,
                caseCategory: data.caseCategory,
                caseComplexity: data.caseComplexity,
                country: data.country,
                therapeuticArea: data.therapeuticArea,
                productName: data.productName,
                source: data.source,
                seriousness: data.seriousness,
                haVapIndicator: data.haVapIndicator,
                isDevice: data.isDevice,
                isPregnancy: data.isPregnancy,
                manufacturerReceiptDate: mrd,
                centralReceiptDate: new Date(data.centralReceiptDate),
                slaDeadline,
                currentStage: 'INTAKE',
                currentStatus: 'UNALLOCATED',
            },
        })

        // Create initial stage event
        await prisma.caseStageEvent.create({
            data: {
                tenantId,
                caseId: newCase.id,
                toStage: 'INTAKE',
                performedById: session.user.id,
                notes: 'Case created',
            },
        })

        await logAudit({
            tenantId,
            userId: session.user.id,
            action: AuditActions.CASE_CREATED,
            entityType: 'Case',
            entityId: newCase.id,
            after: { referenceId: data.referenceId, caseNumber: data.caseNumber },
            ipAddress: getClientIp(request),
            userAgent: getUserAgent(request),
        })

        return NextResponse.json(successResponse(newCase, undefined, tenantId), { status: 201 })
    } catch (error) {
        console.error('[API] POST /api/cases error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to create case'), { status: 500 })
    }
}
