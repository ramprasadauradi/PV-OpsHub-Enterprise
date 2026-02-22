import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'

const STAGES = ['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION'] as const

function bandCounts(daysLeft: number) {
    if (daysLeft > 7) return { green: 1, amber: 0, red: 0 }
    if (daysLeft >= 3) return { green: 0, amber: 1, red: 0 }
    return { green: 0, amber: 0, red: 1 }
}

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const now = new Date()
        const { searchParams } = new URL(request.url)
        const groupBy = searchParams.get('groupBy') ?? 'stage' // 'stage' | 'country'

        const activeCases = await prisma.case.findMany({
            where: { tenantId, currentStatus: { not: 'COMPLETED' } },
            select: { currentStage: true, slaDeadline: true, country: true },
        })

        if (groupBy === 'country') {
            const countries = [...new Set(activeCases.map((c) => c.country || 'Unknown'))].sort()
            const heatmapData: Array<{ yLabel: string; xLabel: string; green: number; amber: number; red: number; total: number }> = []
            for (const yLabel of countries) {
                for (const xLabel of STAGES) {
                    const stageCases = activeCases.filter((c) => (c.country || 'Unknown') === yLabel && c.currentStage === xLabel)
                    let green = 0, amber = 0, red = 0
                    stageCases.forEach((c) => {
                        const daysLeft = Math.ceil((c.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        const b = bandCounts(daysLeft)
                        green += b.green
                        amber += b.amber
                        red += b.red
                    })
                    heatmapData.push({ yLabel, xLabel, green, amber, red, total: stageCases.length })
                }
            }
            return NextResponse.json(successResponse({ heatmap: heatmapData, groupBy: 'country', stages: [...STAGES], rows: countries }, undefined, tenantId))
        }

        // default: by stage — one row "All", columns = stages
        const heatmapData = STAGES.map((xLabel) => {
            const stageCases = activeCases.filter((c) => c.currentStage === xLabel)
            let green = 0, amber = 0, red = 0
            stageCases.forEach((c) => {
                const daysLeft = Math.ceil((c.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const b = bandCounts(daysLeft)
                green += b.green
                amber += b.amber
                red += b.red
            })
            return { yLabel: 'All', xLabel, green, amber, red, total: stageCases.length }
        })

        return NextResponse.json(successResponse({ heatmap: heatmapData, groupBy: 'stage', stages: [...STAGES], rows: ['All'] }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/sla/calculate error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to calculate SLA'), { status: 500 })
    }
}
