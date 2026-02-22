import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sanitizeSearchQuery } from '@/lib/security/sanitization'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ results: [], query: '', total: 0 })
    }

    const tenantId = session.user.tenantId
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20)

    const query = sanitizeSearchQuery(rawQuery)

    if (query.length < 2) {
        return NextResponse.json({ results: [], query, total: 0 })
    }

    try {
        const cases = await prisma.case.findMany({
            where: {
                tenantId,
                OR: [
                    { referenceId: { contains: query, mode: 'insensitive' } },
                    { caseNumber: { contains: query, mode: 'insensitive' } },
                    { productName: { contains: query, mode: 'insensitive' } },
                    { therapeuticArea: { contains: query, mode: 'insensitive' } },
                    { country: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                referenceId: true,
                caseNumber: true,
                productName: true,
                therapeuticArea: true,
                country: true,
                currentStage: true,
                currentStatus: true,
                slaDeadline: true,
                slaRiskScore: true,
            },
            take: limit,
            orderBy: { slaRiskScore: 'desc' },
        })

        const results = cases.map((c) => ({
            id: c.id,
            type: 'case' as const,
            title: `${c.referenceId} — ${c.caseNumber}`,
            subtitle: `${c.productName} | ${c.therapeuticArea} | ${c.country}`,
            referenceId: c.referenceId,
            caseNumber: c.caseNumber,
            productName: c.productName,
            currentStage: c.currentStage,
            currentStatus: c.currentStatus,
            slaRiskScore: c.slaRiskScore,
            url: `/cases/${c.id}`,
        }))

        return NextResponse.json({
            results,
            query,
            total: results.length,
        })
    } catch (error) {
        console.error('[API] GET /api/search error:', error)
        return NextResponse.json(
            { error: 'Search failed', query },
            { status: 500 }
        )
    }
}
