import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

// Analytics API endpoint with dynamic chart type resolution
// GET /api/analytics?type=volumeTrend|slaCompliance|caseDistribution|...

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        const tenantId = session.user.tenantId

        const { searchParams } = new URL(request.url)
        const chartType = searchParams.get('type') ?? 'summary'
        const months = parseInt(searchParams.get('months') ?? '12')

        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1)

        // Try snapshot cache first
        const snapshot = await prisma.analyticsSnapshot.findFirst({
            where: {
                tenantId,
                snapshotType: chartType,
                expiresAt: { gt: now },
            },
            orderBy: { computedAt: 'desc' },
        })

        if (snapshot) {
            return NextResponse.json(successResponse({ chartType, data: snapshot.data, cached: true }, undefined, tenantId))
        }

        // Compute fresh data
        const chartData = await computeChartData(tenantId, chartType, startDate, now)
        return NextResponse.json(successResponse({ chartType, data: chartData, cached: false }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/analytics error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Analytics computation failed'), { status: 500 })
    }
}

async function computeChartData(tenantId: string, chartType: string, start: Date, end: Date) {
    switch (chartType) {
        case 'summary':
            return computeSummary(tenantId)
        case 'volumeTrend':
            return computeVolumeTrend(tenantId, start, end)
        case 'slaCompliance':
            return computeSLACompliance(tenantId, start, end)
        case 'caseDistribution':
            return computeCaseDistribution(tenantId)
        case 'geoDistribution':
            return computeGeoDistribution(tenantId)
        case 'complexityTrend':
            return computeComplexityTrend(tenantId, start, end)
        case 'sourceBreakdown':
            return computeSourceBreakdown(tenantId)
        case 'fpqTrend':
            return computeFPQTrend(tenantId, start, end)
        case 'correctionPareto':
            return computeCorrectionPareto(tenantId)
        case 'productivityMetrics':
            return computeProductivityMetrics(tenantId)
        case 'workloadDistribution':
            return computeWorkloadDistribution(tenantId)
        case 'slaBreach':
            return computeSLABreach(tenantId)
        case 'agingFunnel':
            return computeAgingFunnel(tenantId)
        default:
            return computeSummary(tenantId)
    }
}

async function computeSummary(tenantId: string) {
    const [totalCases, activeCases, completedCases, corrections, slaMisses, holdEvents] = await Promise.all([
        prisma.case.count({ where: { tenantId } }),
        prisma.case.count({ where: { tenantId, currentStatus: { in: ['ALLOCATED', 'IN_PROGRESS'] } } }),
        prisma.case.count({ where: { tenantId, currentStatus: 'COMPLETED' } }),
        prisma.correction.count({ where: { tenantId } }),
        prisma.case.count({ where: { tenantId, slaDeadline: { lt: new Date() }, currentStatus: { not: 'COMPLETED' } } }),
        prisma.holdEvent.count({ where: { tenantId } }),
    ])

    const fpq = totalCases > 0 ? ((totalCases - corrections) / totalCases) * 100 : 100
    const slaCompliance = totalCases > 0 ? ((totalCases - slaMisses) / totalCases) * 100 : 100

    return { totalCases, activeCases, completedCases, corrections, slaMisses, holdEvents, fpq: Math.round(fpq * 100) / 100, slaCompliance: Math.round(slaCompliance * 100) / 100 }
}

async function computeVolumeTrend(tenantId: string, start: Date, end: Date) {
    const cases = await prisma.case.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { createdAt: true, caseCategory: true },
        orderBy: { createdAt: 'asc' },
    })

    const monthlyData: Record<string, { month: string; initial: number; followUp: number; total: number }> = {}
    for (const c of cases) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[key]) monthlyData[key] = { month: key, initial: 0, followUp: 0, total: 0 }
        monthlyData[key].total++
        if (c.caseCategory === 'INITIAL') monthlyData[key].initial++
        else monthlyData[key].followUp++
    }

    return Object.values(monthlyData)
}

async function computeSLACompliance(tenantId: string, start: Date, end: Date) {
    const cases = await prisma.case.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { createdAt: true, slaDeadline: true, currentStatus: true, updatedAt: true },
    })

    const monthlyData: Record<string, { month: string; total: number; onTime: number; breached: number; rate: number }> = {}
    for (const c of cases) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[key]) monthlyData[key] = { month: key, total: 0, onTime: 0, breached: 0, rate: 0 }
        monthlyData[key].total++
        const resolved = c.currentStatus === 'COMPLETED' ? c.updatedAt : new Date()
        if (resolved <= c.slaDeadline) monthlyData[key].onTime++
        else monthlyData[key].breached++
    }

    for (const m of Object.values(monthlyData)) {
        m.rate = m.total > 0 ? Math.round((m.onTime / m.total) * 10000) / 100 : 100
    }

    return Object.values(monthlyData)
}

async function computeCaseDistribution(tenantId: string) {
    const cases = await prisma.case.findMany({
        where: { tenantId },
        select: { reportType: true, caseComplexity: true, seriousness: true, haVapIndicator: true },
    })

    const byType: Record<string, number> = {}
    const byComplexity: Record<string, number> = {}
    const bySeriousness: Record<string, number> = {}
    const byHAVAP: Record<string, number> = {}

    for (const c of cases) {
        byType[c.reportType] = (byType[c.reportType] || 0) + 1
        byComplexity[c.caseComplexity] = (byComplexity[c.caseComplexity] || 0) + 1
        bySeriousness[c.seriousness] = (bySeriousness[c.seriousness] || 0) + 1
        byHAVAP[c.haVapIndicator] = (byHAVAP[c.haVapIndicator] || 0) + 1
    }

    return {
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        byComplexity: Object.entries(byComplexity).map(([name, value]) => ({ name, value })),
        bySeriousness: Object.entries(bySeriousness).map(([name, value]) => ({ name, value })),
        byHAVAP: Object.entries(byHAVAP).map(([name, value]) => ({ name, value })),
    }
}

async function computeGeoDistribution(tenantId: string) {
    const cases = await prisma.case.findMany({
        where: { tenantId },
        select: { country: true },
    })
    const byCountry: Record<string, number> = {}
    for (const c of cases) {
        byCountry[c.country] = (byCountry[c.country] || 0) + 1
    }
    return Object.entries(byCountry).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 15)
}

async function computeComplexityTrend(tenantId: string, start: Date, end: Date) {
    const cases = await prisma.case.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { createdAt: true, caseComplexity: true },
    })
    const monthlyData: Record<string, Record<string, number>> = {}
    for (const c of cases) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[key]) monthlyData[key] = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
        monthlyData[key][c.caseComplexity]++
    }
    return Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }))
}

async function computeSourceBreakdown(tenantId: string) {
    const cases = await prisma.case.findMany({
        where: { tenantId },
        select: { source: true, therapeuticArea: true },
    })
    const bySource: Record<string, number> = {}
    const byTA: Record<string, number> = {}
    for (const c of cases) {
        bySource[c.source] = (bySource[c.source] || 0) + 1
        byTA[c.therapeuticArea] = (byTA[c.therapeuticArea] || 0) + 1
    }
    return {
        bySource: Object.entries(bySource).map(([name, value]) => ({ name, value })),
        byTherapeuticArea: Object.entries(byTA).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10),
    }
}

async function computeFPQTrend(tenantId: string, start: Date, end: Date) {
    const cases = await prisma.case.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true },
    })
    const corrections = await prisma.correction.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { caseId: true, createdAt: true },
    })
    const casesByMonth: Record<string, Set<string>> = {}
    const corrCases: Record<string, Set<string>> = {}
    for (const c of cases) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
        if (!casesByMonth[key]) casesByMonth[key] = new Set()
        casesByMonth[key].add(c.id)
    }
    for (const c of corrections) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
        if (!corrCases[key]) corrCases[key] = new Set()
        corrCases[key].add(c.caseId)
    }
    return Object.keys(casesByMonth).map(month => {
        const total = casesByMonth[month].size
        const withCorrections = corrCases[month]?.size ?? 0
        return { month, total, withCorrections, fpq: total > 0 ? Math.round(((total - withCorrections) / total) * 10000) / 100 : 100 }
    })
}

async function computeCorrectionPareto(tenantId: string) {
    const corrections = await prisma.correction.findMany({
        where: { tenantId },
        select: { category: true },
    })
    const byCategory: Record<string, number> = {}
    for (const c of corrections) byCategory[c.category] = (byCategory[c.category] || 0) + 1
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
    const total = sorted.reduce((s, [, v]) => s + v, 0)
    let cumulative = 0
    return sorted.map(([category, count]) => {
        cumulative += count
        return { category, count, cumulative, cumulativePercent: Math.round((cumulative / total) * 10000) / 100 }
    })
}

async function computeProductivityMetrics(tenantId: string) {
    const users = await prisma.user.findMany({
        where: { tenantId, role: 'PROCESSOR', isActive: true },
        select: { id: true, name: true },
    })
    const allocations = await prisma.caseAllocation.findMany({
        where: { tenantId, isActive: true },
        select: { assignedToId: true },
    })
    const corrections = await prisma.correction.findMany({
        where: { tenantId },
        select: { correctedById: true },
    })
    const allocByUser: Record<string, number> = {}
    const corrByUser: Record<string, number> = {}
    for (const a of allocations) allocByUser[a.assignedToId] = (allocByUser[a.assignedToId] || 0) + 1
    for (const c of corrections) corrByUser[c.correctedById] = (corrByUser[c.correctedById] || 0) + 1

    return users.slice(0, 20).map(u => ({
        name: u.name,
        cases: allocByUser[u.id] || 0,
        corrections: corrByUser[u.id] || 0,
        fpq: (allocByUser[u.id] || 0) > 0 ? Math.round((((allocByUser[u.id] || 0) - (corrByUser[u.id] || 0)) / (allocByUser[u.id] || 1)) * 10000) / 100 : 100,
    }))
}

async function computeWorkloadDistribution(tenantId: string) {
    const users = await prisma.user.findMany({
        where: { tenantId, role: 'PROCESSOR', isActive: true },
        select: { id: true, name: true, dailyCaseLimit: true },
    })
    const activeCases = await prisma.case.findMany({
        where: { tenantId, currentStatus: { in: ['ALLOCATED', 'IN_PROGRESS'] } },
        select: { assignedToId: true },
    })
    const byUser: Record<string, number> = {}
    for (const c of activeCases) {
        if (c.assignedToId) byUser[c.assignedToId] = (byUser[c.assignedToId] || 0) + 1
    }
    return users.map(u => ({
        name: u.name,
        current: byUser[u.id] || 0,
        limit: u.dailyCaseLimit,
        utilization: Math.round(((byUser[u.id] || 0) / u.dailyCaseLimit) * 100),
    })).sort((a, b) => b.utilization - a.utilization).slice(0, 20)
}

async function computeSLABreach(tenantId: string) {
    const stages: Record<string, string> = { INTAKE: 'Intake', DE: 'Data Entry', QC: 'Quality Check', MR: 'Medical Review', SUBMISSION: 'Submission' }
    const result = await Promise.all(Object.entries(stages).map(async ([code, label]) => {
        const breached = await prisma.case.count({ where: { tenantId, currentStage: code as never, slaDeadline: { lt: new Date() }, currentStatus: { not: 'COMPLETED' } } })
        const total = await prisma.case.count({ where: { tenantId, currentStage: code as never, currentStatus: { not: 'COMPLETED' } } })
        return { stage: label, breached, total, atRisk: Math.max(0, total - breached) }
    }))
    return result
}

async function computeAgingFunnel(tenantId: string) {
    const now = new Date()
    const buckets = [
        { label: '0-3 days', min: 0, max: 3 },
        { label: '4-7 days', min: 4, max: 7 },
        { label: '8-14 days', min: 8, max: 14 },
        { label: '15-30 days', min: 15, max: 30 },
        { label: '30+ days', min: 31, max: 999 },
    ]
    const activeCases = await prisma.case.findMany({
        where: { tenantId, currentStatus: { in: ['ALLOCATED', 'IN_PROGRESS', 'UNALLOCATED'] } },
        select: { createdAt: true },
    })
    return buckets.map(bucket => {
        const count = activeCases.filter(c => {
            const days = Math.floor((now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            return days >= bucket.min && days <= bucket.max
        }).length
        return { label: bucket.label, count }
    })
}
