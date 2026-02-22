'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, ShieldCheck, ShieldAlert, Target, FileText, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

interface CapaRecord {
    id: string
    status: 'OPEN' | 'RESOLVED'
    isResolved: boolean
    description: string
    rootCause: string | null
    actionPlan: string | null
    targetDate: string | null
    triggerCategory: string
    createdAt: string
    resolvedAt: string | null
    triggeredBy?: { id: string; name: string }
    corrections?: Array<{ id: string; category: string; description: string }>
}

export default function CAPAPage() {
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

    const { data, isLoading } = useQuery({
        queryKey: ['quality', 'capa', filter],
        queryFn: async () => {
            const params = filter !== 'all' ? `?status=${filter}` : ''
            const res = await fetch(`/api/quality/capa${params}`)
            if (!res.ok) throw new Error('Failed to fetch CAPA records')
            return res.json()
        },
    })

    const responseData = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined
    const capas: CapaRecord[] = (responseData?.capas as CapaRecord[]) ?? []
    const stats = (responseData?.stats as Record<string, number>) ?? {}

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        CAPA Management
                    </h1>
                    <p className="text-muted-foreground">
                        {isLoading ? 'Loading...' : `${stats.total ?? 0} total · ${stats.open ?? 0} open · ${stats.resolved ?? 0} resolved`}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total CAPAs</p>
                                <p className="text-3xl font-bold">{isLoading ? '—' : stats.total ?? 0}</p>
                            </div>
                            <Shield className="h-8 w-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Open CAPAs</p>
                                <p className="text-3xl font-bold text-destructive">{isLoading ? '—' : stats.open ?? 0}</p>
                            </div>
                            <ShieldAlert className="h-8 w-8 text-destructive opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                                <p className="text-3xl font-bold text-green-600">{isLoading ? '—' : stats.resolved ?? 0}</p>
                            </div>
                            <ShieldCheck className="h-8 w-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* CAPA List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            ) : capas.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-muted-foreground">
                            <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">
                                {filter === 'open' ? 'No Open CAPAs' : filter === 'resolved' ? 'No Resolved CAPAs' : 'No CAPA Records'}
                            </h3>
                            <p className="text-sm mt-2 max-w-md mx-auto">
                                CAPAs are automatically triggered when corrections exceed configured thresholds.
                                All clear for now.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {capas.map((capa) => (
                        <Card key={capa.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={capa.status === 'OPEN' ? 'destructive' : 'success'}
                                            className="text-xs"
                                        >
                                            {capa.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {capa.triggerCategory.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(new Date(capa.createdAt))}
                                    </span>
                                </div>

                                <p className="text-sm font-medium mb-2">{capa.description}</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    {capa.rootCause && (
                                        <div className="flex items-start gap-2">
                                            <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">Root Cause</p>
                                                <p className="text-sm">{capa.rootCause}</p>
                                            </div>
                                        </div>
                                    )}
                                    {capa.actionPlan && (
                                        <div className="flex items-start gap-2">
                                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">Action Plan</p>
                                                <p className="text-sm">{capa.actionPlan}</p>
                                            </div>
                                        </div>
                                    )}
                                    {capa.targetDate && (
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">Target Date</p>
                                                <p className="text-sm">{formatDate(new Date(capa.targetDate))}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    <span>Triggered by: {capa.triggeredBy?.name ?? 'System'}</span>
                                    {capa.corrections && capa.corrections.length > 0 && (
                                        <span>{capa.corrections.length} linked correction{capa.corrections.length > 1 ? 's' : ''}</span>
                                    )}
                                    {capa.resolvedAt && (
                                        <span>Resolved: {formatDate(new Date(capa.resolvedAt))}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
