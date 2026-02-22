export const WORKFLOW_STAGES = [
    { code: 'INTAKE', label: 'Intake', description: 'Case received and registered', order: 1, color: '#6366f1' },
    { code: 'DE', label: 'Data Entry', description: 'Data entry and coding', order: 2, color: '#3b82f6' },
    { code: 'QC', label: 'Quality Check', description: 'Quality review and validation', order: 3, color: '#f59e0b' },
    { code: 'MR', label: 'Medical Review', description: 'Medical assessment', order: 4, color: '#8b5cf6' },
    { code: 'SUBMISSION', label: 'Submission', description: 'Regulatory submission', order: 5, color: '#22c55e' },
    { code: 'COMPLETED', label: 'Completed', description: 'Case closed', order: 6, color: '#16a34a' },
] as const

export type WorkflowStageCode = (typeof WORKFLOW_STAGES)[number]['code']

export function getStageLabel(code: string): string {
    return WORKFLOW_STAGES.find((s) => s.code === code)?.label ?? code
}

export function getStageColor(code: string): string {
    return WORKFLOW_STAGES.find((s) => s.code === code)?.color ?? '#6b7280'
}

export function getNextStage(current: string): string | null {
    const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.code === current)
    if (currentIdx === -1 || currentIdx >= WORKFLOW_STAGES.length - 1) return null
    return WORKFLOW_STAGES[currentIdx + 1].code
}

export const CASE_STATUSES = [
    { code: 'UNALLOCATED', label: 'Unallocated', color: '#6b7280', bgColor: '#f9fafb' },
    { code: 'ALLOCATED', label: 'Allocated', color: '#3b82f6', bgColor: '#eff6ff' },
    { code: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b', bgColor: '#fffbeb' },
    { code: 'ON_HOLD', label: 'On Hold', color: '#ef4444', bgColor: '#fef2f2' },
    { code: 'COMPLETED', label: 'Completed', color: '#22c55e', bgColor: '#f0fdf4' },
] as const

export function getStatusMeta(code: string) {
    return CASE_STATUSES.find((s) => s.code === code) ?? {
        code,
        label: code,
        color: '#6b7280',
        bgColor: '#f9fafb',
    }
}
