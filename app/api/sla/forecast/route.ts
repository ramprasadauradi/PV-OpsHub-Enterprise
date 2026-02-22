import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/types'
import { addDays, format } from 'date-fns'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(errorResponse('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
        }

        const tenantId = session.user.tenantId
        const now = new Date()
        const forecast: Array<{ date: string; predictedBreaches: number; riskLevel: string }> = []

        for (let i = 0; i < 7; i++) {
            const targetDate = addDays(now, i)
            const nextDate = addDays(now, i + 1)

            const breachCount = await prisma.case.count({
                where: {
                    tenantId,
                    currentStatus: { not: 'COMPLETED' },
                    slaDeadline: { gte: targetDate, lt: nextDate },
                },
            })

            forecast.push({
                date: format(targetDate, 'yyyy-MM-dd'),
                predictedBreaches: breachCount,
                riskLevel: breachCount > 10 ? 'red' : breachCount > 5 ? 'amber' : 'green',
            })
        }

        return NextResponse.json(successResponse({ forecast }, undefined, tenantId))
    } catch (error) {
        console.error('[API] GET /api/sla/forecast error:', error)
        return NextResponse.json(errorResponse('INTERNAL', 'Failed to forecast breaches'), { status: 500 })
    }
}
