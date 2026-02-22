import prisma from '@/lib/prisma'

export interface WorkflowStageInfo {
    stageCode: string
    stageLabel: string
    stageOrder: number
    isEnabled: boolean
    color: string
    slaDays: number | null
    isRequired: boolean
    description: string | null
}

const DEFAULT_STAGES: WorkflowStageInfo[] = [
    { stageCode: 'INTAKE', stageLabel: 'Intake', stageOrder: 1, isEnabled: true, color: '#6366f1', slaDays: null, isRequired: true, description: 'Case intake and triage' },
    { stageCode: 'DE', stageLabel: 'Data Entry', stageOrder: 2, isEnabled: true, color: '#3b82f6', slaDays: null, isRequired: true, description: 'Data entry and coding' },
    { stageCode: 'QC', stageLabel: 'Quality Check', stageOrder: 3, isEnabled: true, color: '#f59e0b', slaDays: null, isRequired: true, description: 'Quality check and review' },
    { stageCode: 'MR', stageLabel: 'Medical Review', stageOrder: 4, isEnabled: true, color: '#10b981', slaDays: null, isRequired: true, description: 'Medical review by clinician' },
    { stageCode: 'SUBMISSION', stageLabel: 'Submission', stageOrder: 5, isEnabled: true, color: '#8b5cf6', slaDays: null, isRequired: true, description: 'Regulatory submission' },
    { stageCode: 'COMPLETED', stageLabel: 'Completed', stageOrder: 6, isEnabled: true, color: '#22c55e', slaDays: null, isRequired: true, description: 'Case completed' },
]

// In-memory cache for stage configs per tenant
const stageCache = new Map<string, { stages: WorkflowStageInfo[]; expiresAt: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function getActiveStages(tenantId: string): Promise<WorkflowStageInfo[]> {
    const now = Date.now()
    const cached = stageCache.get(tenantId)
    if (cached && cached.expiresAt > now) return cached.stages

    const configs = await prisma.workflowConfig.findMany({
        where: { tenantId, isEnabled: true },
        orderBy: { stageOrder: 'asc' },
    })

    const stages = configs.length > 0
        ? configs.map((c: any) => ({
            stageCode: c.stageCode,
            stageLabel: c.stageLabel,
            stageOrder: c.stageOrder,
            isEnabled: c.isEnabled,
            color: c.color,
            slaDays: c.slaDays,
            isRequired: c.isRequired,
            description: c.description,
        }))
        : DEFAULT_STAGES

    stageCache.set(tenantId, { stages, expiresAt: now + CACHE_TTL_MS })
    return stages
}

export async function getAllStages(tenantId: string): Promise<WorkflowStageInfo[]> {
    const configs = await prisma.workflowConfig.findMany({
        where: { tenantId },
        orderBy: { stageOrder: 'asc' },
    })

    return configs.length > 0
        ? configs.map((c: any) => ({
            stageCode: c.stageCode,
            stageLabel: c.stageLabel,
            stageOrder: c.stageOrder,
            isEnabled: c.isEnabled,
            color: c.color,
            slaDays: c.slaDays,
            isRequired: c.isRequired,
            description: c.description,
        }))
        : DEFAULT_STAGES
}

export async function getNextStage(tenantId: string, currentStage: string): Promise<string | null> {
    const stages = await getActiveStages(tenantId)
    const idx = stages.findIndex(s => s.stageCode === currentStage)
    if (idx === -1 || idx === stages.length - 1) return null
    return stages[idx + 1].stageCode
}

export async function isValidTransition(tenantId: string, fromStage: string, toStage: string): Promise<boolean> {
    const nextStage = await getNextStage(tenantId, fromStage)
    return toStage === nextStage
}

export function invalidateCache(tenantId: string): void {
    stageCache.delete(tenantId)
}

export { DEFAULT_STAGES }
