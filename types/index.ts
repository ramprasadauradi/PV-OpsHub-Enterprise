import { z } from 'zod'

// ═══════════════════════════════════════════
// API Response Wrapper
// ═══════════════════════════════════════════

export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: { code: string; message: string }
    pagination?: { page: number; pageSize: number; total: number }
    meta?: { tenantId: string; timestamp: string; requestId: string }
}

export function successResponse<T>(
    data: T,
    pagination?: { page: number; pageSize: number; total: number },
    tenantId?: string
): APIResponse<T> {
    return {
        success: true,
        data,
        pagination,
        meta: {
            tenantId: tenantId ?? '',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
        },
    }
}

export function errorResponse(code: string, message: string): APIResponse<never> {
    return {
        success: false,
        error: { code, message },
        meta: {
            tenantId: '',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
        },
    }
}

// ═══════════════════════════════════════════
// Zod Schemas
// ═══════════════════════════════════════════

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const CaseCreateSchema = z.object({
    referenceId: z.string().min(1, 'Reference ID is required'),
    caseNumber: z.string().min(1, 'Case number is required'),
    reportType: z.string().min(1, 'Report type is required'),
    caseCategory: z.enum(['INITIAL', 'FOLLOW_UP']),
    caseComplexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    country: z.string().min(1, 'Country is required'),
    therapeuticArea: z.string().min(1, 'Therapeutic area is required'),
    productName: z.string().min(1, 'Product name is required'),
    source: z.enum(['LP', 'CO']),
    seriousness: z.enum(['FATAL', 'LIFE_THREATENING', 'SERIOUS', 'NON_SERIOUS']),
    haVapIndicator: z.enum(['HA', 'VAP', 'NEITHER']),
    isDevice: z.boolean().default(false),
    isPregnancy: z.boolean().default(false),
    manufacturerReceiptDate: z.string().datetime(),
    centralReceiptDate: z.string().datetime(),
})

export const CaseFilterSchema = z.object({
    reportType: z.string().optional(),
    caseCategory: z.enum(['INITIAL', 'FOLLOW_UP']).optional(),
    caseComplexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    country: z.string().optional(),
    seriousness: z.enum(['FATAL', 'LIFE_THREATENING', 'SERIOUS', 'NON_SERIOUS']).optional(),
    haVapIndicator: z.enum(['HA', 'VAP', 'NEITHER']).optional(),
    currentStage: z.enum(['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED']).optional(),
    currentStatus: z.enum(['UNALLOCATED', 'ALLOCATED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']).optional(),
    assigneeId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(50),
    sortBy: z.string().default('slaDeadline'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const AllocationSchema = z.object({
    caseIds: z.array(z.string()).min(1, 'At least one case is required'),
    assignToUserId: z.string().min(1, 'Assignee is required'),
})

export const HoldSchema = z.object({
    holdType: z.enum(['ALL', 'SPECIFIC']),
    caseIds: z.array(z.string()).optional(),
    notes: z.string().optional(),
    autoReleaseHours: z.number().positive().optional(),
})

export const CorrectionSchema = z.object({
    caseId: z.string().min(1),
    stage: z.enum(['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED']),
    category: z.enum([
        'DATA_ENTRY', 'CODING', 'NARRATIVE', 'DUPLICATE',
        'MISSING_FOLLOWUP', 'SLA_MISS', 'MR_RETURN',
    ]),
    description: z.string().min(1, 'Description is required'),
})

export const StageAdvanceSchema = z.object({
    toStage: z.enum(['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED']),
    notes: z.string().optional(),
    clockStop: z.boolean().default(false),
    clockResume: z.boolean().default(false),
})

export const ReportTypeConfigSchema = z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    isEnabled: z.boolean().default(true),
    isCustom: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
})

export const SLARuleSchema = z.object({
    country: z.string().min(1),
    licensePartner: z.string().default('DEFAULT'),
    reportType: z.string().default('ALL'),
    seriousness: z.string().default('ALL'),
    submissionDays: z.number().int().positive(),
    useBusinessDays: z.boolean().default(false),
    isHACase: z.boolean().default(false),
    effectiveDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
})

export const GovernanceConfigSchema = z.object({
    dailyCaseLimit: z.number().int().positive().optional(),
    maxReassignments: z.number().int().positive().optional(),
    capaThreshold: z.number().int().positive().optional(),
    holdAutoReleaseHours: z.number().int().positive().optional(),
    refreshIntervalSec: z.number().int().positive().optional(),
    fpqMinThreshold: z.number().positive().optional(),
})

export const UserCreateSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum([
        'SUPER_ADMIN', 'TENANT_ADMIN', 'PROJECT_MANAGER',
        'QUALITY_MANAGER', 'OPS_MANAGER', 'TEAM_LEAD', 'PROCESSOR',
    ]),
    dailyCaseLimit: z.number().int().positive().default(20),
    timezone: z.string().default('UTC'),
    password: z.string().min(8),
})

// ═══════════════════════════════════════════
// Dashboard Types
// ═══════════════════════════════════════════

export interface KPIData {
    label: string
    value: number | string
    change?: number
    changeLabel?: string
    icon?: string
    color?: 'green' | 'amber' | 'red' | 'blue' | 'purple'
}

export interface AgingBucket {
    label: string
    count: number
    stage?: string
}

export interface LeaderboardEntry {
    rank: number
    userId: string
    name: string
    value: number
    delta?: number
    isCurrentUser?: boolean
}

export interface DashboardTabConfig {
    id: string
    label: string
    order: number
    isVisible: boolean
}

export interface CorrectionHeatmapCell {
    userId: string
    userName: string
    category: string
    count: number
}

// ═══════════════════════════════════════════
// SLA Types
// ═══════════════════════════════════════════

export interface SLAResult {
    deadline: Date
    daysRemaining: number
    riskScore: number
    totalDays: number
    clockStopDays: number
}

export interface SLAHeatmapCell {
    stage: string
    groupKey: string
    greenCount: number
    amberCount: number
    redCount: number
    totalCount: number
}

export interface BreachForecast {
    date: string
    predictedBreaches: number
    riskLevel: 'green' | 'amber' | 'red'
}

// Inferred types from schemas
export type CaseCreateInput = z.infer<typeof CaseCreateSchema>
export type CaseFilterInput = z.infer<typeof CaseFilterSchema>
export type AllocationInput = z.infer<typeof AllocationSchema>
export type HoldInput = z.infer<typeof HoldSchema>
export type CorrectionInput = z.infer<typeof CorrectionSchema>
export type StageAdvanceInput = z.infer<typeof StageAdvanceSchema>
