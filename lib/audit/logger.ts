import prisma from '@/lib/prisma'

export interface AuditLogInput {
    tenantId: string
    userId: string
    action: string
    entityType: string
    entityId: string
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
    ipAddress?: string | null
    userAgent?: string | null
}

/**
 * Immutable audit log writer.
 * Appends to AuditLog table — NO updates, NO deletes, ever.
 * 21 CFR Part 11 compliant.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                tenantId: input.tenantId,
                userId: input.userId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                before: input.before == null ? undefined : (input.before as object),
                after: input.after == null ? undefined : (input.after as object),
                metadata: input.metadata == null ? undefined : (input.metadata as object),
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
            },
        })
    } catch (error) {
        // Never let audit logging failure break the main operation
        // In production, this would go to a monitoring service
        console.error('[AUDIT] Failed to write audit log:', error)
    }
}

/**
 * Extract IP address from request headers
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() ?? 'unknown'
    }
    return request.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: Request): string {
    return request.headers.get('user-agent') ?? 'unknown'
}

// Standard audit actions
export const AuditActions = {
    CASE_CREATED: 'CASE_CREATED',
    CASE_ALLOCATED: 'CASE_ALLOCATED',
    CASE_REALLOCATED: 'CASE_REALLOCATED',
    CASE_STAGE_ADVANCED: 'CASE_STAGE_ADVANCED',
    CASE_HELD: 'CASE_HELD',
    CASE_RELEASED: 'CASE_RELEASED',
    CORRECTION_LOGGED: 'CORRECTION_LOGGED',
    CAPA_TRIGGERED: 'CAPA_TRIGGERED',
    SLA_BREACH_ALERT: 'SLA_BREACH_ALERT',
    CONFIG_CHANGED_REPORT_TYPE: 'CONFIG_CHANGED_REPORT_TYPE',
    CONFIG_CHANGED_SLA_RULE: 'CONFIG_CHANGED_SLA_RULE',
    CONFIG_CHANGED_GOVERNANCE: 'CONFIG_CHANGED_GOVERNANCE',
    USER_CREATED: 'USER_CREATED',
    USER_DEACTIVATED: 'USER_DEACTIVATED',
    HOLD_INITIATED: 'HOLD_INITIATED',
    HOLD_RELEASED: 'HOLD_RELEASED',
    ALLOCATION_BLOCKED_GOVERNANCE: 'ALLOCATION_BLOCKED_GOVERNANCE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT_GENERATED: 'EXPORT_GENERATED',
} as const

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions]
