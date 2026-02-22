import prisma from '@/lib/prisma'
import { logAudit, AuditActions } from '@/lib/audit/logger'

interface AllocationRequest {
    tenantId: string
    caseId: string
    assignToUserId: string
    allocatedByUserId: string
    allocatorRole: string
}

interface AllocationResult {
    success: boolean
    error?: string
    allocationId?: string
}

/**
 * Governance-first allocation engine.
 * Enforces ALL rules server-side before any allocation is committed.
 */
export async function allocateCase(request: AllocationRequest): Promise<AllocationResult> {
    const { tenantId, caseId, assignToUserId, allocatedByUserId, allocatorRole } = request

    // 1. Get tenant config
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxReassignments: true },
    })

    if (!tenant) {
        return { success: false, error: 'Tenant not found' }
    }

    // 2. Check PM hold: If hold active → block allocation
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
        await logAudit({
            tenantId,
            userId: allocatedByUserId,
            action: AuditActions.ALLOCATION_BLOCKED_GOVERNANCE,
            entityType: 'Case',
            entityId: caseId,
            metadata: { reason: 'PM hold active', holdId: activeHold.id },
        })
        return { success: false, error: 'Allocation blocked: PM hold is active on this case' }
    }

    // 3. Check assignee daily limit
    const assignee = await prisma.user.findUnique({
        where: { id: assignToUserId },
        select: { dailyCaseLimit: true, name: true },
    })

    if (!assignee) {
        return { success: false, error: 'Assignee not found' }
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
        await logAudit({
            tenantId,
            userId: allocatedByUserId,
            action: AuditActions.ALLOCATION_BLOCKED_GOVERNANCE,
            entityType: 'Case',
            entityId: caseId,
            metadata: {
                reason: 'Daily limit exceeded',
                assignee: assignToUserId,
                limit: assignee.dailyCaseLimit,
                current: allocatedToday,
            },
        })
        return {
            success: false,
            error: `Assignee daily limit reached (${allocatedToday}/${assignee.dailyCaseLimit})`,
        }
    }

    // 4. Check reassignment count
    const existingAllocations = await prisma.caseAllocation.count({
        where: { tenantId, caseId },
    })

    const allocationNum = existingAllocations + 1

    if (allocationNum > tenant.maxReassignments + 1) {
        await logAudit({
            tenantId,
            userId: allocatedByUserId,
            action: AuditActions.ALLOCATION_BLOCKED_GOVERNANCE,
            entityType: 'Case',
            entityId: caseId,
            metadata: {
                reason: 'Max reassignments exceeded',
                current: existingAllocations,
                max: tenant.maxReassignments,
            },
        })
        return {
            success: false,
            error: `${allocationNum}th reassignment requires manager review (max: ${tenant.maxReassignments})`,
        }
    }

    // 5. Perform allocation
    try {
        // Deactivate previous allocations
        await prisma.caseAllocation.updateMany({
            where: { tenantId, caseId, isActive: true },
            data: { isActive: false },
        })

        // Create new allocation
        const allocation = await prisma.caseAllocation.create({
            data: {
                tenantId,
                caseId,
                assignedToId: assignToUserId,
                allocatedById: allocatedByUserId,
                allocatorRole: allocatorRole as never,
                allocationNum,
                criteria: {},
                isActive: true,
            },
        })

        // Update case status
        await prisma.case.update({
            where: { id: caseId },
            data: {
                currentStatus: 'ALLOCATED',
                assignedToId: assignToUserId,
            },
        })

        // Audit log
        await logAudit({
            tenantId,
            userId: allocatedByUserId,
            action: allocationNum > 1 ? AuditActions.CASE_REALLOCATED : AuditActions.CASE_ALLOCATED,
            entityType: 'Case',
            entityId: caseId,
            after: {
                assignedTo: assignToUserId,
                assigneeName: assignee.name,
                allocationNum,
                allocatorRole,
            },
        })

        return { success: true, allocationId: allocation.id }
    } catch (error) {
        console.error('[ALLOCATION] Failed:', error)
        return { success: false, error: 'Allocation failed due to a system error' }
    }
}

/**
 * Bulk allocate multiple cases to a single user
 */
export async function bulkAllocate(
    tenantId: string,
    caseIds: string[],
    assignToUserId: string,
    allocatedByUserId: string,
    allocatorRole: string
): Promise<{ results: AllocationResult[]; successCount: number; failCount: number }> {
    const results: AllocationResult[] = []
    let successCount = 0
    let failCount = 0

    for (const caseId of caseIds) {
        const result = await allocateCase({
            tenantId,
            caseId,
            assignToUserId,
            allocatedByUserId,
            allocatorRole,
        })
        results.push({ ...result })
        if (result.success) successCount++
        else failCount++
    }

    return { results, successCount, failCount }
}
