import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/types'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') ?? 'csv'

        if (format === 'csv') {
            const cases = await prisma.case.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                include: {
                    allocations: {
                        where: { isActive: true },
                        include: { assignedTo: { select: { name: true } } },
                    },
                },
            })

            const headers = [
                'Reference ID', 'Case Number', 'Report Type', 'Country', 'Stage',
                'Status', 'Seriousness', 'HA/VAP', 'Product', 'Assigned To',
                'SLA Risk %', 'Deadline', 'Created At',
            ]
            const rows = cases.map((c) => [
                c.referenceId,
                c.caseNumber,
                c.reportType,
                c.country,
                c.currentStage,
                c.currentStatus,
                c.seriousness,
                c.haVapIndicator,
                c.productName ?? '',
                c.allocations[0]?.assignedTo?.name ?? 'Unassigned',
                String(Math.round(c.slaRiskScore)),
                c.slaDeadline.toISOString().split('T')[0],
                c.createdAt.toISOString().split('T')[0],
            ])

            const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')

            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="pvopshub_cases_${new Date().toISOString().split('T')[0]}.csv"`,
                },
            })
        }

        if (format === 'audit-csv') {
            const logs = await prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true } } },
            })

            const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Details']
            const rows = logs.map((l) => [
                l.createdAt.toISOString(),
                l.user?.name ?? l.userId,
                l.user?.email ?? '',
                l.action,
                l.entityType,
                l.entityId,
                JSON.stringify(l.after ?? l.metadata ?? {}),
            ])

            const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')

            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="pvopshub_audit_${new Date().toISOString().split('T')[0]}.csv"`,
                },
            })
        }

        return NextResponse.json(errorResponse('BAD_REQUEST', `Unsupported format: ${format}`), { status: 400 })
    } catch (error) {
        console.error('[API] GET /api/reports/export error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to export data'), { status: 500 })
    }
}
