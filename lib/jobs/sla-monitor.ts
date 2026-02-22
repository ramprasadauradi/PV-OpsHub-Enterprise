import prisma from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

/**
 * SLA Monitor job: find cases past SLA deadline or at risk and create notifications / trigger alerts.
 * Run periodically (e.g. every 15 min) via BullMQ.
 */
export async function runSLAMonitor(): Promise<{ breached: number; atRisk: number }> {
    const now = new Date()
    let breached = 0
    let atRisk = 0

    try {
        const tenants = await prisma.tenant.findMany({ select: { id: true } })
        for (const tenant of tenants) {
            const casesPastDue = await prisma.case.findMany({
                where: {
                    tenantId: tenant.id,
                    currentStatus: { not: 'COMPLETED' },
                    slaDeadline: { lt: now },
                },
                select: { id: true, referenceId: true, slaDeadline: true },
            })
            breached += casesPastDue.length

            const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
            const casesAtRisk = await prisma.case.findMany({
                where: {
                    tenantId: tenant.id,
                    currentStatus: { not: 'COMPLETED' },
                    slaDeadline: { gte: now, lte: inThreeDays },
                },
                select: { id: true, referenceId: true, slaDeadline: true },
            })
            atRisk += casesAtRisk.length

            // In a full implementation: create Notification records or push to alerts queue
            if (casesPastDue.length > 0) {
                logger.warn('SLA breaches detected', { tenantId: tenant.id, count: casesPastDue.length, module: 'jobs:sla-monitor' })
            }
        }
    } catch (err) {
        logger.error('SLA monitor job failed', err as Error, { module: 'jobs:sla-monitor' })
        throw err
    }

    return { breached, atRisk }
}
