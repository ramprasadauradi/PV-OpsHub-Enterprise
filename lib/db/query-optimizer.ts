import { Prisma } from '@prisma/client'

// ═══════════════════════════════════════════
// Common query fragments for performance
// ═══════════════════════════════════════════

export function activeCasesWhere(tenantId: string): Prisma.CaseWhereInput {
    return {
        tenantId,
        currentStatus: { not: 'COMPLETED' },
    }
}

export function caseSLAOrderBy(
    direction: 'asc' | 'desc' = 'asc'
): Prisma.CaseOrderByWithRelationInput {
    return { slaDeadline: direction }
}

export function caseRiskOrderBy(): Prisma.CaseOrderByWithRelationInput {
    return { slaRiskScore: 'desc' }
}

export function slaBreachWhere(tenantId: string, now: Date = new Date()): Prisma.CaseWhereInput {
    return {
        tenantId,
        slaDeadline: { lt: now },
        currentStatus: { not: 'COMPLETED' },
    }
}

export function upcomingDeadlinesWhere(
    tenantId: string,
    hoursAhead: number = 48
): Prisma.CaseWhereInput {
    const now = new Date()
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
    return {
        tenantId,
        slaDeadline: { gte: now, lte: future },
        currentStatus: { not: 'COMPLETED' },
    }
}

export function activeAllocationsWhere(
    tenantId: string,
    userId?: string
): Prisma.CaseAllocationWhereInput {
    return {
        tenantId,
        isActive: true,
        ...(userId ? { assignedToId: userId } : {}),
    }
}

export function activeHoldsWhere(tenantId: string): Prisma.HoldEventWhereInput {
    return {
        tenantId,
        releasedAt: null,
    }
}

export function unresolvedCorrectionsWhere(
    tenantId: string,
    userId?: string
): Prisma.CorrectionWhereInput {
    return {
        tenantId,
        isResolved: false,
        ...(userId ? { correctedById: userId } : {}),
    }
}

export function dateRangeWhere(
    from: Date,
    to: Date
): { gte: Date; lte: Date } {
    return { gte: from, lte: to }
}

// Common select shapes for performance
export const caseListSelect = {
    id: true,
    referenceId: true,
    caseNumber: true,
    reportType: true,
    caseCategory: true,
    caseComplexity: true,
    country: true,
    productName: true,
    seriousness: true,
    currentStage: true,
    currentStatus: true,
    slaDeadline: true,
    slaRiskScore: true,
    isHeld: true,
    assignedToId: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.CaseSelect

export const caseMinimalSelect = {
    id: true,
    referenceId: true,
    caseNumber: true,
    currentStage: true,
    currentStatus: true,
    slaDeadline: true,
    slaRiskScore: true,
} satisfies Prisma.CaseSelect
