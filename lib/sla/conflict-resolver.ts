/**
 * SLA Conflict Resolver
 * When multiple SLA rules match a case, the SHORTEST deadline wins.
 * This ensures the most conservative (strictest) deadline is applied.
 */

interface SLARuleCandidate {
    id: string
    country: string
    licensePartner: string
    reportType: string
    seriousness: string
    submissionDays: number
    useBusinessDays: boolean
    isHACase: boolean
    specificity: number // computed priority score
}

/**
 * Given a set of matching rules, rank them and pick the winning rule.
 * Priority: specificity score → then shortest deadline
 */
export function resolveConflict(rules: SLARuleCandidate[]): SLARuleCandidate | null {
    if (rules.length === 0) return null
    if (rules.length === 1) return rules[0]

    // Calculate specificity for each rule
    const scored = rules.map((rule) => ({
        ...rule,
        specificity: computeSpecificity(rule),
    }))

    // Sort by: specificity DESC, then submissionDays ASC (shortest wins on tie)
    scored.sort((a, b) => {
        if (b.specificity !== a.specificity) return b.specificity - a.specificity
        return a.submissionDays - b.submissionDays
    })

    return scored[0]
}

function computeSpecificity(rule: SLARuleCandidate): number {
    let score = 0
    if (rule.country !== 'DEFAULT') score += 10
    if (rule.licensePartner !== 'DEFAULT') score += 5
    if (rule.reportType !== 'ALL') score += 3
    if (rule.seriousness !== 'ALL') score += 3
    if (rule.isHACase) score += 2
    return score
}

/**
 * Get the effective deadline — always picks the shortest from all applicable rules
 */
export function getShortestDeadline(deadlines: Date[]): Date {
    if (deadlines.length === 0) {
        throw new Error('No deadlines provided for conflict resolution')
    }
    return deadlines.reduce((shortest, current) =>
        current < shortest ? current : shortest
    )
}
