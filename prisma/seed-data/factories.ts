import {
    THERAPEUTIC_AREAS,
    PRODUCTS_BY_AREA,
    COUNTRIES_WEIGHTED,
    REPORT_TYPES_WEIGHTED,
    CORRECTION_DESCRIPTIONS,
    CORRECTION_CATEGORIES,
} from './constants'

function randomItem<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function weightedRandom<T>(items: [T, number][]): T {
    const totalWeight = items.reduce((sum, [, w]) => sum + w, 0)
    let r = Math.random() * totalWeight
    for (const [item, weight] of items) {
        r -= weight
        if (r <= 0) return item
    }
    return items[items.length - 1][0]
}

const STAGES = ['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED'] as const
const CATEGORIES: ('INITIAL' | 'FOLLOW_UP')[] = ['INITIAL', 'FOLLOW_UP']
const COMPLEXITIES: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const SOURCES: ('LP' | 'CO')[] = ['LP', 'CO']

export function createCase(
    tenantId: string,
    _region: string,
    index: number,
    now: Date
): Record<string, unknown> {
    let reportType = weightedRandom(REPORT_TYPES_WEIGHTED)
    let seriousness = weightedRandom<'FATAL' | 'LIFE_THREATENING' | 'SERIOUS' | 'NON_SERIOUS'>([
        ['FATAL', 4], ['LIFE_THREATENING', 8], ['SERIOUS', 28], ['NON_SERIOUS', 60],
    ])
    let haVap = weightedRandom<'HA' | 'VAP' | 'NEITHER'>([['HA', 8], ['VAP', 12], ['NEITHER', 80]])
    let isPregnancy = false
    let complexity = weightedRandom<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>([
        ['LOW', 35], ['MEDIUM', 40], ['HIGH', 18], ['CRITICAL', 7],
    ])

    if (reportType === 'EXPEDITED_E2A') {
        seriousness = weightedRandom<'SERIOUS' | 'LIFE_THREATENING' | 'FATAL'>([['SERIOUS', 70], ['LIFE_THREATENING', 20], ['FATAL', 10]])
    }
    if (reportType === 'PREGNANCY_LACTATION') {
        isPregnancy = true
    }
    if ((seriousness === 'FATAL' || seriousness === 'LIFE_THREATENING') && Math.random() < 0.4) {
        haVap = 'HA'
    }
    if (seriousness === 'FATAL') {
        complexity = weightedRandom<'HIGH' | 'CRITICAL'>([['HIGH', 60], ['CRITICAL', 40]])
    }
    if (seriousness === 'NON_SERIOUS' && Math.random() < 0.8) {
        complexity = weightedRandom<'LOW' | 'MEDIUM'>([['LOW', 50], ['MEDIUM', 50]])
    }

    const stage = weightedRandom<(typeof STAGES)[number]>([
        ['INTAKE', 8], ['DE', 22], ['QC', 18], ['MR', 12], ['SUBMISSION', 15], ['COMPLETED', 25],
    ])
    const status = stage === 'COMPLETED'
        ? 'COMPLETED' as const
        : weightedRandom<'UNALLOCATED' | 'ALLOCATED' | 'IN_PROGRESS'>([
            ['UNALLOCATED', 15], ['ALLOCATED', 25], ['IN_PROGRESS', 60],
        ])

    const mrd = randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now)
    const crd = new Date(mrd.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000)

    const slaDays = seriousness === 'FATAL' || seriousness === 'LIFE_THREATENING' ? 7
        : seriousness === 'SERIOUS' ? 15 : 90
    const slaDeadline = new Date(crd.getTime() + slaDays * 24 * 60 * 60 * 1000)
    if (haVap === 'HA') {
        const sevenDays = new Date(crd.getTime() + 7 * 24 * 60 * 60 * 1000)
        if (slaDeadline.getTime() > sevenDays.getTime()) slaDeadline.setTime(sevenDays.getTime())
    }

    const daysToDeadline = (slaDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    const slaRiskScore = stage === 'COMPLETED' ? 0
        : daysToDeadline < 0 ? Math.min(100, 85 + Math.abs(daysToDeadline))
            : daysToDeadline < 3 ? 75 + (3 - daysToDeadline) * 8
                : daysToDeadline < 7 ? 50 + (7 - daysToDeadline) * (25 / 4)
                    : Math.max(0, 50 - daysToDeadline * 0.5)

    const country = weightedRandom(COUNTRIES_WEIGHTED)
    const area = randomItem(THERAPEUTIC_AREAS)
    const products = PRODUCTS_BY_AREA[area] ?? ['Zolmira 50mg', 'Nexoprax 100mg']
    const productName = randomItem(products)

    const refId = `REF-2025-${String(index).padStart(6, '0')}`
    const caseNum = `${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}-2025-${String(randomInt(1, 99999)).padStart(5, '0')}`

    return {
        tenantId,
        referenceId: refId,
        caseNumber: caseNum,
        reportType,
        caseCategory: randomItem(CATEGORIES),
        caseComplexity: complexity,
        country,
        therapeuticArea: area,
        productName,
        source: randomItem(SOURCES),
        seriousness,
        haVapIndicator: haVap,
        isDevice: Math.random() < 0.05,
        isPregnancy,
        manufacturerReceiptDate: mrd,
        centralReceiptDate: crd,
        currentStage: stage,
        currentStatus: status,
        slaDeadline,
        slaRiskScore: Math.round(slaRiskScore * 100) / 100,
        isHeld: false,
    }
}

const category = ['INITIAL', 'FOLLOW_UP'] as const

export function createStageEvents(
    tenantId: string,
    caseId: string,
    currentStage: string,
    processorIds: string[],
    caseCreatedAt: Date
): Array<Record<string, unknown>> {
    const stageOrder = STAGES.slice(0, STAGES.indexOf(currentStage as (typeof STAGES)[number]) + 1)
    const events: Array<Record<string, unknown>> = []
    let prevDate = caseCreatedAt

    for (let i = 0; i < stageOrder.length; i++) {
        const eventDate = new Date(prevDate.getTime() + randomInt(1, 4) * 24 * 60 * 60 * 1000)
        events.push({
            tenantId,
            caseId,
            fromStage: i === 0 ? null : stageOrder[i - 1],
            toStage: stageOrder[i],
            performedById: randomItem(processorIds),
            notes: i === 0 ? 'Case received' : `Advanced to ${stageOrder[i]}`,
            clockStop: false,
            clockResume: false,
            createdAt: eventDate,
        })
        prevDate = eventDate
    }
    return events
}

export function createCorrection(
    tenantId: string,
    caseId: string,
    correctedById: string,
    stage: string
): Record<string, unknown> {
    const categoryIdx = randomInt(0, CORRECTION_CATEGORIES.length - 1)
    return {
        tenantId,
        caseId,
        correctedById,
        stage,
        category: CORRECTION_CATEGORIES[categoryIdx],
        description: CORRECTION_DESCRIPTIONS[randomInt(0, CORRECTION_DESCRIPTIONS.length - 1)],
        isResolved: Math.random() < 0.7,
        resolvedAt: Math.random() < 0.7 ? new Date() : null,
        capaTriggered: Math.random() < 0.15,
    }
}

export function createAuditEntry(
    tenantId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    createdAt?: Date
): Record<string, unknown> {
    return {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        before: null,
        after: null,
        metadata: {},
        ipAddress: `192.168.${randomInt(1, 254)}.${randomInt(1, 254)}`,
        userAgent: 'PV-OpsHub/1.0 Seed',
        createdAt: createdAt ?? new Date(),
    }
}
