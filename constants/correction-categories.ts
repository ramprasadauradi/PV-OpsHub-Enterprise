export const CORRECTION_CATEGORIES = [
    { code: 'DATA_ENTRY', label: 'Data Entry Error', color: '#ef4444', icon: '📝' },
    { code: 'CODING', label: 'Coding Error', color: '#f97316', icon: '🏷️' },
    { code: 'NARRATIVE', label: 'Narrative Issue', color: '#eab308', icon: '📄' },
    { code: 'DUPLICATE', label: 'Duplicate Case', color: '#22c55e', icon: '📋' },
    { code: 'MISSING_FOLLOWUP', label: 'Missing Follow-up', color: '#3b82f6', icon: '🔍' },
    { code: 'SLA_MISS', label: 'SLA Miss', color: '#dc2626', icon: '⏰' },
    { code: 'MR_RETURN', label: 'MR Return', color: '#8b5cf6', icon: '↩️' },
] as const

export type CorrectionCategoryCode = (typeof CORRECTION_CATEGORIES)[number]['code']

export function getCorrectionCategoryMeta(code: string) {
    return CORRECTION_CATEGORIES.find((c) => c.code === code) ?? {
        code,
        label: code,
        color: '#6b7280',
        icon: '❓',
    }
}
