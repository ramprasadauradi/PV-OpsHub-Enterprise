import prisma from '@/lib/prisma'
import { addDays, differenceInDays, isWeekend } from 'date-fns'

type SLAParams = {
    tenantId: string
    country: string
    licensePartner?: string
    reportType: string
    seriousness: 'FATAL' | 'LIFE_THREATENING' | 'SERIOUS' | 'NON_SERIOUS'
    haVapIndicator: 'HA' | 'VAP' | 'NEITHER'
    mrd: Date
    clockStopMinutes?: number
}

type SLAResult = {
    deadline: Date
    daysRemaining: number
    riskScore: number
    riskColor: 'red' | 'amber' | 'green'
    ruleApplied: string
    submissionDays: number
    isBusinessDays: boolean
}

export async function calculateSLA(params: SLAParams): Promise<SLAResult> {
    const today = new Date()

    // Step 1: Query all matching active SLA configs
    const configs = await prisma.sLAConfig.findMany({
        where: {
            tenantId: params.tenantId,
            isActive: true,
            effectiveDate: { lte: today },
            OR: [{ expiryDate: null }, { expiryDate: { gte: today } }],
        },
        orderBy: { priority: 'desc' },
    })

    // Step 2: Score each config for specificity match
    const scored = configs
        .map(config => {
            let score = config.priority * 1000

            const matchCountry = config.country === params.country
            const matchDefault = config.country === 'DEFAULT'
            if (!matchCountry && !matchDefault) return null

            if (matchCountry) score += 100
            if (config.licensePartner === (params.licensePartner ?? 'DEFAULT')) score += 50
            else if (config.licensePartner === 'DEFAULT') score -= 10

            if (config.seriousness === params.seriousness) score += 40
            else if (config.seriousness !== 'ALL') return null
            else score -= 5

            if (config.haVapIndicator === params.haVapIndicator) score += 30
            else if (config.haVapIndicator !== 'ALL') return null
            else score -= 5

            if (config.reportType === params.reportType) score += 20
            else if (config.reportType !== 'ALL') return null
            else score -= 5

            if (config.country === 'DEFAULT') score -= 30

            return { config, score }
        })
        .filter(Boolean) as { config: (typeof configs)[number]; score: number }[]

    if (!scored.length) {
        // Hardcoded safety defaults
        const defaults: Record<string, number> = {
            FATAL: 7,
            LIFE_THREATENING: 7,
            SERIOUS: 15,
            NON_SERIOUS: 90,
        }
        const days = params.haVapIndicator === 'HA' ? 7 : defaults[params.seriousness]
        return buildResult(params.mrd, days, false, params.clockStopMinutes ?? 0, 'System Default')
    }

    // Step 3: Among top-scoring configs, use SHORTEST deadline (safest)
    const maxScore = Math.max(...scored.map(s => s.score))
    const candidates = scored.filter(s => s.score === maxScore)
    const winner = candidates.reduce((a, b) =>
        a.config.submissionDays <= b.config.submissionDays ? a : b
    )

    return buildResult(
        params.mrd,
        winner.config.submissionDays,
        winner.config.useBusinessDays,
        winner.config.clockStopAllowed ? (params.clockStopMinutes ?? 0) : 0,
        winner.config.configName
    )
}

function buildResult(
    mrd: Date,
    days: number,
    businessDays: boolean,
    clockStopMinutes: number,
    ruleName: string
): SLAResult {
    const deadline = businessDays ? addBusinessDays(mrd, days) : addDays(mrd, days)
    const adjustedDeadline = new Date(deadline.getTime() + clockStopMinutes * 60 * 1000)
    const daysRemaining = differenceInDays(adjustedDeadline, new Date())

    let riskScore: number
    let riskColor: 'red' | 'amber' | 'green'

    if (daysRemaining < 0) {
        riskScore = 100
        riskColor = 'red'
    } else if (daysRemaining < 3) {
        riskScore = 80 + Math.round(((3 - daysRemaining) / 3) * 20)
        riskColor = 'red'
    } else if (daysRemaining < 7) {
        riskScore = 50 + Math.round(((7 - daysRemaining) / 4) * 30)
        riskColor = 'amber'
    } else {
        riskScore = Math.max(0, 50 - Math.round((daysRemaining / days) * 50))
        riskColor = 'green'
    }

    return {
        deadline: adjustedDeadline,
        daysRemaining,
        riskScore: Math.min(100, Math.max(0, riskScore)),
        riskColor,
        ruleApplied: ruleName,
        submissionDays: days,
        isBusinessDays: businessDays,
    }
}

function addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date)
    let added = 0
    while (added < days) {
        result = addDays(result, 1)
        if (!isWeekend(result)) added++
    }
    return result
}

// Convenience function for simple SLA queries using the old SLARuleConfig model
export function daysRemaining(deadline: Date): number {
    return differenceInDays(deadline, new Date())
}

export function slaColor(daysLeft: number): string {
    if (daysLeft < 0) return 'red'
    if (daysLeft < 3) return 'red'
    if (daysLeft < 7) return 'amber'
    return 'green'
}
