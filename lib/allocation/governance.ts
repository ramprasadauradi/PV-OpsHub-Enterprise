import prisma from '@/lib/prisma'

interface GovernanceCheckResult {
    allowed: boolean
    reason?: string
    details?: Record<string, unknown>
}

/**
 * Check all governance rules before allocation.
 * Returns whether the allocation is allowed and the reason if not.
 */
export async function checkGovernance(
    tenantId: string,
    caseId: string,
    assignToUserId: string
): Promise<GovernanceCheckResult> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            maxReassignments: true,
            holdAutoReleaseHours: true,
        },
    })

    if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' }
    }

    // Check 1: PM Hold
    const activeHold = await prisma.holdEvent.findFirst({
        where: {
            tenantId,
            releasedAt: null,
            OR: [
                { holdType: 'ALL' },
                { holdType: 'SPECIFIC', caseId },
            ],
        },
    })

    if (activeHold) {
        return {
            allowed: false,
            reason: 'PM hold is active',
            details: { holdId: activeHold.id, holdType: activeHold.holdType },
        }
    }

    // Check 2: Daily limit
    const assignee = await prisma.user.findUnique({
        where: { id: assignToUserId },
        select: { dailyCaseLimit: true },
    })

    if (!assignee) {
        return { allowed: false, reason: 'Assignee not found' }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const allocatedToday = await prisma.caseAllocation.count({
        where: {
            tenantId,
            assignedToId: assignToUserId,
            isActive: true,
            allocatedAt: { gte: todayStart },
        },
    })

    if (allocatedToday >= assignee.dailyCaseLimit) {
        return {
            allowed: false,
            reason: `Daily limit reached (${allocatedToday}/${assignee.dailyCaseLimit})`,
            details: { current: allocatedToday, limit: assignee.dailyCaseLimit },
        }
    }

    // Check 3: Reassignment count
    const reassignmentCount = await prisma.caseAllocation.count({
        where: { tenantId, caseId },
    })

    if (reassignmentCount >= tenant.maxReassignments + 1) {
        return {
            allowed: false,
            reason: `Max reassignments exceeded (${reassignmentCount}/${tenant.maxReassignments})`,
            details: { current: reassignmentCount, max: tenant.maxReassignments },
        }
    }

    return { allowed: true }
}

/**
 * Get available capacity for a user (remaining allocations today)
 */
export async function getUserCapacity(
    tenantId: string,
    userId: string
): Promise<{ total: number; used: number; available: number }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { dailyCaseLimit: true },
    })

    if (!user) {
        return { total: 0, used: 0, available: 0 }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const used = await prisma.caseAllocation.count({
        where: {
            tenantId,
            assignedToId: userId,
            isActive: true,
            allocatedAt: { gte: todayStart },
        },
    })

    return {
        total: user.dailyCaseLimit,
        used,
        available: Math.max(0, user.dailyCaseLimit - used),
    }
}
