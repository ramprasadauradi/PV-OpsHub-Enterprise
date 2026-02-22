export const SLA_DEFAULTS = {
    INDIA: {
        CDSCO: {
            SERIOUS: { submissionDays: 15, useBusinessDays: false },
            NON_SERIOUS: { submissionDays: 90, useBusinessDays: false },
            FATAL: { submissionDays: 7, useBusinessDays: false },
            LIFE_THREATENING: { submissionDays: 15, useBusinessDays: false },
        },
    },
    US: {
        FDA: {
            SERIOUS: { submissionDays: 15, useBusinessDays: true },
            NON_SERIOUS: { submissionDays: 90, useBusinessDays: true },
            FATAL: { submissionDays: 7, useBusinessDays: true },
            LIFE_THREATENING: { submissionDays: 15, useBusinessDays: true },
        },
    },
    EU: {
        EMA: {
            SERIOUS: { submissionDays: 15, useBusinessDays: false },
            NON_SERIOUS: { submissionDays: 90, useBusinessDays: false },
            FATAL: { submissionDays: 7, useBusinessDays: false },
            LIFE_THREATENING: { submissionDays: 15, useBusinessDays: false },
        },
    },
} as const

export const SLA_RISK_THRESHOLDS = {
    HEALTHY: { max: 50, label: 'Healthy', color: '#16A34A' },
    AT_RISK: { max: 75, label: 'At Risk', color: '#D97706' },
    CRITICAL: { max: 100, label: 'Critical', color: '#DC2626' },
    BREACHED: { max: Infinity, label: 'Breached', color: '#7F1D1D' },
} as const

export const SLA_COLOR_BANDS = {
    GREEN: { minDays: 8, label: '> 7 days', color: '#22c55e', bgColor: '#f0fdf4' },
    AMBER: { minDays: 3, maxDays: 7, label: '3–7 days', color: '#f59e0b', bgColor: '#fffbeb' },
    RED: { minDays: 0, maxDays: 2, label: '< 3 days', color: '#ef4444', bgColor: '#fef2f2' },
} as const

export const SLA_REGIONAL_DEFAULTS = [
    { country: 'India (CDSCO)', seriousDays: 15, nonSeriousDays: 90 },
    { country: 'United States (FDA)', seriousDays: 15, nonSeriousDays: 90 },
    { country: 'EU (EMA)', seriousDays: 15, nonSeriousDays: 90 },
    { country: 'Japan (PMDA)', seriousDays: 15, nonSeriousDays: 90 },
    { country: 'United Kingdom (MHRA)', seriousDays: 15, nonSeriousDays: 90 },
] as const
