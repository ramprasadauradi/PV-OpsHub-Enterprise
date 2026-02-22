import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const metricsSecret = process.env.METRICS_SECRET
    if (!metricsSecret) {
        return NextResponse.json({ error: 'Metrics not configured' }, { status: 503 })
    }

    const authHeader = request.headers.get('x-metrics-secret')
    if (authHeader !== metricsSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const tenants = await prisma.tenant.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
        })

        const lines: string[] = [
            '# HELP pv_cases_total Total number of PV cases by tenant, status, and stage',
            '# TYPE pv_cases_total gauge',
        ]

        for (const tenant of tenants) {
            const tenantLabel = tenant.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()

            const statusCounts = await prisma.case.groupBy({
                by: ['currentStatus'],
                where: { tenantId: tenant.id },
                _count: true,
            })

            for (const row of statusCounts) {
                lines.push(
                    `pv_cases_total{tenant="${tenantLabel}",status="${row.currentStatus}"} ${row._count}`
                )
            }

            const stageCounts = await prisma.case.groupBy({
                by: ['currentStage'],
                where: { tenantId: tenant.id },
                _count: true,
            })

            lines.push('')
            lines.push('# HELP pv_cases_by_stage Cases grouped by workflow stage')
            lines.push('# TYPE pv_cases_by_stage gauge')
            for (const row of stageCounts) {
                lines.push(
                    `pv_cases_by_stage{tenant="${tenantLabel}",stage="${row.currentStage}"} ${row._count}`
                )
            }

            const breachedCount = await prisma.case.count({
                where: {
                    tenantId: tenant.id,
                    slaDeadline: { lt: new Date() },
                    currentStatus: { not: 'COMPLETED' },
                },
            })

            lines.push('')
            lines.push('# HELP pv_sla_breach_total Number of SLA-breached active cases')
            lines.push('# TYPE pv_sla_breach_total gauge')
            lines.push(`pv_sla_breach_total{tenant="${tenantLabel}"} ${breachedCount}`)

            const holdCount = await prisma.holdEvent.count({
                where: {
                    tenantId: tenant.id,
                    releasedAt: null,
                },
            })

            lines.push('')
            lines.push('# HELP pv_active_holds Number of currently active holds')
            lines.push('# TYPE pv_active_holds gauge')
            lines.push(`pv_active_holds{tenant="${tenantLabel}"} ${holdCount}`)

            const correctionCounts = await prisma.correction.groupBy({
                by: ['category'],
                where: { tenantId: tenant.id },
                _count: true,
            })

            lines.push('')
            lines.push('# HELP pv_corrections_total Total corrections by category')
            lines.push('# TYPE pv_corrections_total counter')
            for (const row of correctionCounts) {
                lines.push(
                    `pv_corrections_total{tenant="${tenantLabel}",category="${row.category}"} ${row._count}`
                )
            }
        }

        lines.push('')
        lines.push('# HELP pv_app_uptime_seconds Application uptime')
        lines.push('# TYPE pv_app_uptime_seconds gauge')
        lines.push(`pv_app_uptime_seconds ${Math.floor(process.uptime())}`)

        const mem = process.memoryUsage()
        lines.push('')
        lines.push('# HELP pv_memory_heap_used_bytes Heap memory used')
        lines.push('# TYPE pv_memory_heap_used_bytes gauge')
        lines.push(`pv_memory_heap_used_bytes ${mem.heapUsed}`)
        lines.push(`pv_memory_heap_total_bytes ${mem.heapTotal}`)

        return new NextResponse(lines.join('\n'), {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
                'Cache-Control': 'no-store',
            },
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Metrics generation failed' },
            { status: 500 }
        )
    }
}
