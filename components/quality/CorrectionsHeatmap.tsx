'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import type { APIResponse } from '@/types'

interface MatrixCell {
    userId: string
    userName: string
    category: string
    count: number
}

export default function CorrectionsHeatmap() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [selectedCell, setSelectedCell] = useState<{ userId: string; category: string } | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['quality', 'corrections-matrix'],
        queryFn: async () => {
            const res = await fetch('/api/quality/corrections-matrix')
            if (!res.ok) throw new Error('Failed to fetch corrections matrix')
            return res.json() as Promise<APIResponse<{ matrix: MatrixCell[]; rows: { id: string; name: string }[]; cols: string[] }>>
        },
    })

    useEffect(() => {
        if (!data?.data?.matrix || !containerRef.current) return

        const matrix = data.data.matrix as MatrixCell[]
        const rows = (data.data.rows as { id: string; name: string }[]) ?? []
        const cols = (data.data.cols as string[]) ?? []
        const maxCount = Math.max(1, ...matrix.map((m) => m.count))

        const cellMap = new Map(matrix.map((m) => [`${m.userId}-${m.category}`, m.count]))

        import('d3').then((d3) => {
            const container = containerRef.current
            if (!container) return
            container.innerHTML = ''

            const margin = { top: 20, right: 20, bottom: 80, left: 120 }
            const width = Math.max(400, 80 * cols.length)
            const height = Math.max(200, 28 * rows.length)
            const cellWidth = (width - margin.left - margin.right) / cols.length
            const cellHeight = (height - margin.top - margin.bottom) / rows.length

            const svg = d3.select(container)
                .append('svg')
                .attr('width', '100%')
                .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
                .attr('preserveAspectRatio', 'xMidYMid meet')

            const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

            const colorScale = d3.scaleLinear<string>()
                .domain([0, 1, Math.min(5, maxCount)])
                .range(['#ffffff', '#fecaca', '#dc2626'])
                .clamp(true)

            rows.forEach((row, i) => {
                cols.forEach((col, j) => {
                    const count = cellMap.get(`${row.id}-${col}`) ?? 0
                    const rect = g.append('g')
                        .attr('transform', `translate(${j * cellWidth},${i * cellHeight})`)
                        .style('cursor', 'pointer')

                    rect.append('rect')
                        .attr('width', cellWidth - 2)
                        .attr('height', cellHeight - 2)
                        .attr('fill', colorScale(count))
                        .attr('stroke', '#e5e7eb')
                        .attr('rx', 2)
                        .on('click', () => setSelectedCell({ userId: row.id, category: col }))

                    rect.append('text')
                        .attr('x', cellWidth / 2 - 1)
                        .attr('y', cellHeight / 2 - 1)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', '11px')
                        .attr('font-weight', 'bold')
                        .attr('fill', count > 2 ? 'white' : '#374151')
                        .text(count)
                })
            })

            const xScale = d3.scaleBand().domain(cols).range([0, width - margin.left - margin.right]).padding(0.1)
            const yScale = d3.scaleBand().domain(rows.map((r) => r.name)).range([0, height - margin.top - margin.bottom]).padding(0.1)

            const xAxis = g.append('g')
                .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
                .call(d3.axisBottom(xScale).tickSize(0))
            xAxis.selectAll('text').attr('class', 'text-[10px] fill-muted-foreground').attr('transform', 'rotate(-35)').attr('text-anchor', 'end')

            const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0))
            yAxis.selectAll('text').attr('class', 'text-[10px] fill-muted-foreground')
        })
    }, [data])

    if (isLoading) {
        return <Skeleton className="h-[320px] w-full" />
    }

    return (
        <div className="space-y-2">
            <div ref={containerRef} className="min-h-[280px] w-full rounded-lg border bg-card p-2" />
            {selectedCell && (
                <p className="text-xs text-muted-foreground">
                    Selected: User {selectedCell.userId} × {selectedCell.category}. Click a cell to filter (link to case list can be added).
                </p>
            )}
        </div>
    )
}
