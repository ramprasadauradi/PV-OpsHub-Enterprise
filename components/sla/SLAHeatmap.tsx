'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { APIResponse } from '@/types'

const STAGES = ['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION']
const COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444', grey: '#6b7280' }

interface HeatmapCell {
    yLabel: string
    xLabel: string
    green: number
    amber: number
    red: number
    total: number
}

function getCellColor(c: HeatmapCell): string {
    if (c.total === 0) return COLORS.grey
    if (c.red > 0) return COLORS.red
    if (c.amber > 0) return COLORS.amber
    return COLORS.green
}

export default function SLAHeatmap() {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const [groupBy, setGroupBy] = useState<'stage' | 'country'>('stage')
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    const { data, isLoading } = useQuery({
        queryKey: ['sla', 'heatmap', groupBy],
        queryFn: async () => {
            const res = await fetch(`/api/sla/calculate?groupBy=${groupBy}`)
            if (!res.ok) throw new Error('Failed to fetch SLA heatmap')
            return res.json() as Promise<APIResponse<{ heatmap: HeatmapCell[]; stages?: string[]; rows?: string[] }>>
        },
        refetchInterval: 30000,
    })

    useEffect(() => {
        if (!data?.data?.heatmap || !containerRef.current) return
        setLastUpdated(new Date())

        const heatmap = (data.data.heatmap as HeatmapCell[]).filter((c) => c.total > 0 || groupBy === 'stage')
        const rows = groupBy === 'country' && data.data.rows
            ? (data.data.rows as string[])
            : [...new Set(heatmap.map((c) => c.yLabel))]
        const cols = (data.data.stages as string[]) ?? STAGES

        // Dynamic import D3 for SSR safety
        import('d3').then((d3) => {
            const container = containerRef.current
            if (!container) return
            container.innerHTML = ''

            const margin = { top: 40, right: 20, bottom: 50, left: groupBy === 'country' ? 100 : 80 }
            const width = Math.max(400, container.clientWidth - margin.left - margin.right)
            const cellHeight = 36
            const cellWidth = Math.max(60, (width - 20) / cols.length)
            const height = Math.max(200, rows.length * cellHeight + margin.top + margin.bottom)

            const svg = d3.select(container)
                .append('svg')
                .attr('width', '100%')
                .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet')

            const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

            const xScale = d3.scaleBand().domain(cols).range([0, cols.length * cellWidth]).padding(0.05)
            const yScale = d3.scaleBand().domain(rows).range([0, rows.length * cellHeight]).padding(0.05)

            const cellMap = new Map(heatmap.map((c) => [`${c.yLabel}-${c.xLabel}`, c]))

            rows.forEach((yLabel, i) => {
                cols.forEach((xLabel, j) => {
                    const key = `${yLabel}-${xLabel}`
                    const cell = cellMap.get(key) ?? { yLabel, xLabel, green: 0, amber: 0, red: 0, total: 0 }
                    const x = xScale(xLabel) ?? 0
                    const y = yScale(yLabel) ?? 0
                    const rect = g.append('g')
                        .attr('class', 'heatmap-cell')
                        .attr('transform', `translate(${x},${y})`)
                        .style('cursor', 'pointer')

                    rect.append('rect')
                        .attr('width', xScale.bandwidth())
                        .attr('height', yScale.bandwidth())
                        .attr('fill', getCellColor(cell))
                        .attr('rx', 4)
                        .on('click', () => {
                            router.push(`/cases?currentStage=${encodeURIComponent(xLabel)}`)
                        })

                    rect.append('text')
                        .attr('x', xScale.bandwidth() / 2)
                        .attr('y', yScale.bandwidth() / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('fill', cell.total > 0 ? 'white' : '#9ca3af')
                        .attr('font-weight', 'bold')
                        .attr('font-size', '12px')
                        .text(cell.total)

                    rect.append('title').text(
                        `Stage: ${xLabel}${groupBy === 'country' ? ` | Country: ${yLabel}` : ''}\nTotal: ${cell.total}\nRed (<3d): ${cell.red}\nAmber (3-7d): ${cell.amber}\nGreen (>7d): ${cell.green}\nClick to view cases`
                    )
                })
            })

            const xAxis = g.append('g')
                .attr('transform', `translate(0,${rows.length * cellHeight})`)
                .call(d3.axisBottom(xScale).tickSize(0))
            xAxis.selectAll('text').attr('class', 'text-xs fill-muted-foreground')

            const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0))
            yAxis.selectAll('text').attr('class', 'text-xs fill-muted-foreground')
        })
    }, [data, groupBy, router])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[320px] w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'stage' | 'country')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="View by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="stage">By Stage</SelectItem>
                        <SelectItem value="country">By Country</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</p>
            </div>
            <div ref={containerRef} className="min-h-[320px] w-full rounded-lg border bg-card p-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-500" /> &gt;7 days</span>
                <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500" /> 3-7 days</span>
                <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> &lt;3 days</span>
                <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-gray-500" /> No cases</span>
            </div>
        </div>
    )
}
