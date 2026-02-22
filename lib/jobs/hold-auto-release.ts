import prisma from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

/**
 * Hold auto-release job: release holds where autoReleaseAt <= now.
 * Run periodically (e.g. every 5 min) via BullMQ.
 */
export async function runHoldAutoRelease(): Promise<{ released: number }> {
    const now = new Date()
    let released = 0

    try {
        const toRelease = await prisma.holdEvent.findMany({
            where: {
                releasedAt: null,
                autoReleaseAt: { lte: now },
            },
            select: { id: true, tenantId: true, caseId: true },
        })

        for (const hold of toRelease) {
            await prisma.holdEvent.update({
                where: { id: hold.id },
                data: { releasedAt: now, releaseMethod: 'AUTO' },
            })
            if (hold.caseId) {
                await prisma.case.update({
                    where: { id: hold.caseId },
                    data: { isHeld: false },
                })
            } else {
                await prisma.case.updateMany({
                    where: { tenantId: hold.tenantId, isHeld: true },
                    data: { isHeld: false },
                })
            }
            released++
            logger.info('Hold auto-released', { holdId: hold.id, tenantId: hold.tenantId, module: 'jobs:hold-auto-release' })
        }
    } catch (err) {
        logger.error('Hold auto-release job failed', err as Error, { module: 'jobs:hold-auto-release' })
        throw err
    }

    return { released }
}
