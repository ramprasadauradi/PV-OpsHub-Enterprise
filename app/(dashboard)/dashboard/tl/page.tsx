'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import KPICard from '@/components/dashboard/widgets/KPICard'
import { useTLDashboard } from '@/hooks/useDashboard'
import {
    FileText, Users, AlertTriangle, Clock, Shield, BarChart3,
    PauseCircle, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react'
import { formatDate, getSLAColor } from '@/lib/utils'

export default function TLDashboardPage() {
    const { data, isLoading, error } = useTLDashboard()
    const dashData = (data as unknown as { data?: Record<string, unknown> })?.data

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-[500px] rounded-lg" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
                    <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again</p>
                </div>
            </div>
        )
    }

    const allocation = dashData?.allocation as Record<string, unknown> | undefined
    const havap = dashData?.havap as Record<string, unknown> | undefined
    const aging = dashData?.aging as Record<string, unknown> | undefined
    const quality = dashData?.quality as Record<string, unknown> | undefined
    const productivity = dashData?.productivity as Record<string, unknown> | undefined
    const holdStatus = dashData?.holdStatus as Record<string, unknown> | undefined

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Lead Dashboard</h1>
                    <p className="text-muted-foreground">Real-time operations overview</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-xs">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse inline-block" />
                    Live
                </Badge>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    label="Allocated"
                    value={String(allocation?.totalAllocated ?? 0)}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                />
                <KPICard
                    label="Unallocated"
                    value={String(allocation?.totalUnallocated ?? 0)}
                    icon={<FileText className="h-5 w-5" />}
                    color={Number(allocation?.totalUnallocated ?? 0) > 10 ? 'red' : 'green'}
                />
                <KPICard
                    label="HA/VAP Active"
                    value={String(Number(havap?.haCount ?? 0) + Number(havap?.vapCount ?? 0))}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="amber"
                />
                <KPICard
                    label="FPQ %"
                    value={`${quality?.fpqPercent ?? 100}%`}
                    icon={<Shield className="h-5 w-5" />}
                    color={Number(quality?.fpqPercent ?? 100) >= 95 ? 'green' : 'red'}
                />
            </div>

            {/* Hold Banner */}
            {Number(holdStatus?.heldCaseCount ?? 0) > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PauseCircle className="h-5 w-5 text-red-500" />
                        <div>
                            <p className="font-semibold text-red-900">Allocation Hold Active</p>
                            <p className="text-sm text-red-700">{String(holdStatus?.heldCaseCount ?? 0)} cases are currently on hold</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 6-Tab Dashboard */}
            <Tabs defaultValue="allocation" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="allocation" className="text-xs py-2">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Allocation
                    </TabsTrigger>
                    <TabsTrigger value="havap" className="text-xs py-2">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        HA/VAP
                    </TabsTrigger>
                    <TabsTrigger value="aging" className="text-xs py-2">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Aging
                    </TabsTrigger>
                    <TabsTrigger value="quality" className="text-xs py-2">
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Quality
                    </TabsTrigger>
                    <TabsTrigger value="productivity" className="text-xs py-2">
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                        Productivity
                    </TabsTrigger>
                    <TabsTrigger value="holdstatus" className="text-xs py-2">
                        <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                        Holds
                    </TabsTrigger>
                </TabsList>

                {/* Allocation Tab */}
                <TabsContent value="allocation">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Allocation Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Donut chart placeholder */}
                                <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-muted/30">
                                    <div className="relative h-48 w-48">
                                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                                            <circle
                                                cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                                                className="text-primary"
                                                strokeDasharray={`${(Number(allocation?.totalAllocated ?? 0) / Math.max(Number(allocation?.totalAllocated ?? 0) + Number(allocation?.totalUnallocated ?? 0), 1)) * 251.2} 251.2`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold">{String(Number(allocation?.totalAllocated ?? 0) + Number(allocation?.totalUnallocated ?? 0))}</span>
                                            <span className="text-xs text-muted-foreground">Total Cases</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-primary" />
                                            <span className="text-sm">Allocated ({String(allocation?.totalAllocated ?? 0)})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                                            <span className="text-sm">Unallocated ({String(allocation?.totalUnallocated ?? 0)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Unallocated queue */}
                                <div>
                                    <h4 className="font-medium mb-3 text-sm">Unallocated Queue (by SLA Risk)</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {(allocation?.unallocatedCases as Array<Record<string, unknown>> ?? []).slice(0, 10).map((c) => (
                                            <div key={String(c.id)} className="flex items-center justify-between rounded-md border p-2.5 text-sm hover:bg-accent transition-colors">
                                                <div>
                                                    <span className="font-medium">{String(c.referenceId ?? c.caseNumber)}</span>
                                                    <span className="text-muted-foreground ml-2">{String(c.country ?? '')} · {String(c.reportType ?? '')}</span>
                                                </div>
                                                <Badge variant={getSLAColor(Number(c.slaRiskScore ?? 0)) === 'green' ? 'success' : getSLAColor(Number(c.slaRiskScore ?? 0)) === 'red' ? 'destructive' : 'warning'}>
                                                    {String(Math.round(Number(c.slaRiskScore ?? 0)))}%
                                                </Badge>
                                            </div>
                                        ))}
                                        {(allocation?.unallocatedCases as Array<unknown> ?? []).length === 0 && (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                                All cases are allocated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HA/VAP Tab */}
                <TabsContent value="havap">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">HA/VAP Cases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <KPICard label="HA" value={String(havap?.haCount ?? 0)} color="red" size="sm" />
                                <KPICard label="VAP" value={String(havap?.vapCount ?? 0)} color="amber" size="sm" />
                                <KPICard label="Neither" value={String(havap?.neitherCount ?? 0)} color="green" size="sm" />
                            </div>
                            <div className="space-y-2">
                                {(havap?.cases as Array<Record<string, unknown>> ?? []).map((c) => (
                                    <div key={String(c.id)} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Badge variant={String(c.haVapIndicator) === 'HA' ? 'destructive' : 'warning'}>{String(c.haVapIndicator)}</Badge>
                                            <span className="font-medium">{String(c.referenceId ?? c.caseNumber)}</span>
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            Deadline: {c.slaDeadline ? formatDate(new Date(String(c.slaDeadline))) : 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Aging Tab */}
                <TabsContent value="aging">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Case Aging</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                {Object.entries((aging?.buckets as Record<string, number>) ?? { '0-1': 0, '2-3': 0, '4-5': 0, '>5': 0 }).map(([bucket, count]) => (
                                    <div key={bucket} className="text-center p-4 rounded-lg bg-muted/30">
                                        <p className="text-3xl font-bold">{count}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{bucket} days</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Quality Tab */}
                <TabsContent value="quality">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <KPICard label="FPQ %" value={`${quality?.fpqPercent ?? 100}%`} color={Number(quality?.fpqPercent ?? 100) >= 95 ? 'green' : 'red'} size="sm" />
                                <KPICard label="Total Corrections" value={String(quality?.totalCorrections ?? 0)} color="amber" size="sm" />
                                <KPICard label="Open CAPAs" value={String(quality?.capaOpen ?? 0)} color="purple" size="sm" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Productivity Tab */}
                <TabsContent value="productivity">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Productivity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <KPICard label="Processed Today" value={String(productivity?.processedToday ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" size="sm" />
                                <KPICard label="Avg Cycle Time" value={`${productivity?.avgCycleTime ?? 0}d`} color="green" size="sm" />
                                <KPICard label="Rework Rate" value={`${productivity?.reworkRate ?? 0}%`} color={Number(productivity?.reworkRate ?? 0) > 5 ? 'red' : 'green'} size="sm" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hold Status Tab */}
                <TabsContent value="holdstatus">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hold Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <KPICard label="Cases on Hold" value={String(holdStatus?.heldCaseCount ?? 0)} color={Number(holdStatus?.heldCaseCount ?? 0) > 0 ? 'red' : 'green'} size="sm" />
                            </div>
                            <div className="space-y-2">
                                {(holdStatus?.activeHolds as Array<Record<string, unknown>> ?? []).map((hold) => (
                                    <div key={String(hold.id)} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <PauseCircle className="h-4 w-4 text-red-500" />
                                            <span className="font-medium">{String(hold.holdType)} Hold</span>
                                            {hold.case != null && <span className="text-muted-foreground">— {String((hold.case as Record<string, unknown>).referenceId ?? '')}</span>}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {hold.heldAt ? formatDate(new Date(String(hold.heldAt))) : ''}
                                        </span>
                                    </div>
                                ))}
                                {(holdStatus?.activeHolds as Array<unknown> ?? []).length === 0 && (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                        No active holds
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
