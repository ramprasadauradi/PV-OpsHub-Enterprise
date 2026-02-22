'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, AlertTriangle, Download, ClipboardList } from 'lucide-react'
import { CORRECTION_CATEGORIES } from '@/constants/correction-categories'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

const CorrectionsHeatmap = dynamic(() => import('@/components/quality/CorrectionsHeatmap'), { ssr: false })

interface CorrectionRow {
    id: string
    category: string
    description: string
    stage: string
    isResolved: boolean
    createdAt: string
    case?: { id: string; referenceId: string; caseNumber: string }
    correctedBy?: { id: string; name: string }
}

interface CapaRow {
    id: string
    status: string
    isResolved: boolean
    description: string
    rootCause: string | null
    actionPlan: string | null
    triggerCategory: string
    createdAt: string
    triggeredBy?: { id: string; name: string }
}

export default function CorrectionsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['quality', 'corrections'],
        queryFn: async () => {
            const res = await fetch('/api/quality/corrections')
            if (!res.ok) throw new Error('Failed to fetch corrections')
            return res.json()
        },
    })

    const responseData = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined
    const corrections: CorrectionRow[] = (responseData?.corrections as CorrectionRow[]) ?? []
    const capas: CapaRow[] = (responseData?.capas as CapaRow[]) ?? []
    const stats = (responseData?.stats as Record<string, number>) ?? {}

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quality & Corrections</h1>
                    <p className="text-muted-foreground">
                        {isLoading ? 'Loading...' : `${stats.totalCorrections ?? 0} corrections · ${stats.openCapas ?? 0} open CAPAs`}
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Corrections heatmap: User × Category */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Corrections by Processor & Category
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CorrectionsHeatmap />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Correction Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {CORRECTION_CATEGORIES.map((cat) => {
                                const count = corrections.filter((c) => c.category === cat.code).length
                                return (
                                    <div key={cat.code} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl" style={{ backgroundColor: `${cat.color}20` }}>
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{cat.label}</p>
                                                <p className="text-xs text-muted-foreground">{cat.code}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>{count}</Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            CAPA Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : capas.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
                                <h3 className="text-lg font-medium">No CAPAs Triggered</h3>
                                <p className="text-sm mt-1">CAPAs are auto-triggered when corrections exceed thresholds</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {capas.map((capa) => (
                                    <div key={capa.id} className="rounded-lg border p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Badge variant={capa.status === 'OPEN' ? 'destructive' : 'success'} className="text-xs">
                                                {capa.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{formatDate(new Date(capa.createdAt))}</span>
                                        </div>
                                        <p className="text-sm font-medium">{capa.description}</p>
                                        {capa.rootCause && <p className="text-xs text-muted-foreground">Root cause: {capa.rootCause}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            Category: {capa.triggerCategory} · By: {capa.triggeredBy?.name ?? 'System'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Corrections Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Corrections</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : corrections.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No corrections logged yet. Corrections appear here when quality issues are flagged.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-3 text-left font-medium">Case</th>
                                    <th className="p-3 text-left font-medium">Category</th>
                                    <th className="p-3 text-left font-medium">Stage</th>
                                    <th className="p-3 text-left font-medium">Description</th>
                                    <th className="p-3 text-left font-medium">Processor</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                    <th className="p-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {corrections.map((c) => (
                                    <tr key={c.id} className="border-b hover:bg-muted/20">
                                        <td className="p-3 font-mono text-xs">{c.case?.referenceId ?? c.case?.caseNumber ?? '—'}</td>
                                        <td className="p-3">
                                            <Badge variant="outline" className="text-xs">{c.category}</Badge>
                                        </td>
                                        <td className="p-3 text-xs">{c.stage}</td>
                                        <td className="p-3 text-muted-foreground max-w-[250px] truncate">{c.description}</td>
                                        <td className="p-3">{c.correctedBy?.name ?? '—'}</td>
                                        <td className="p-3">
                                            <Badge variant={c.isResolved ? 'success' : 'warning'} className="text-xs">{c.isResolved ? 'Resolved' : 'Open'}</Badge>
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground">{formatDate(new Date(c.createdAt))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
