'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import KPICard from '@/components/dashboard/widgets/KPICard'
import { useProjectDashboard } from '@/hooks/useDashboard'
import { Trophy, Medal, Star, TrendingUp, Shield, XCircle } from 'lucide-react'

export default function ProjectDashboardPage() {
    const [period, setPeriod] = useState<'week' | 'month' | 'ytd'>('month')
    const { data, isLoading, error } = useProjectDashboard(period)
    const dashData = (data as unknown as { data?: Record<string, unknown> })?.data

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-96" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold">Failed to load project dashboard</h3>
                </div>
            </div>
        )
    }

    const kpis = dashData?.kpis as Record<string, number> | undefined
    const leaderboards = dashData?.leaderboards as Record<string, Array<Record<string, unknown>>> | undefined
    const currentUserRole = dashData?.currentUserRole as string | undefined
    const currentUserId = dashData?.currentUserId as string | undefined

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
                    <p className="text-muted-foreground">Performance analytics & leaderboards</p>
                </div>
                <div className="flex items-center gap-2">
                    {(['week', 'month', 'ytd'] as const).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'ytd' ? 'YTD' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard label="Processed" value={String(kpis?.totalProcessed ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" size="sm" />
                <KPICard label="FPQ %" value={`${kpis?.fpqPercent ?? 100}%`} color={Number(kpis?.fpqPercent ?? 100) >= 95 ? 'green' : 'red'} size="sm" />
                <KPICard label="SLA Compliance" value={`${kpis?.slaCompliance ?? 100}%`} color={Number(kpis?.slaCompliance ?? 100) >= 90 ? 'green' : 'red'} size="sm" />
                <KPICard label="Avg Cycle Time" value={`${kpis?.avgCycleTime ?? 0}d`} color="purple" size="sm" />
                <KPICard label="Active Cases" value={String(kpis?.activeCases ?? 0)} color="amber" size="sm" />
                <KPICard label="HA/VAP" value={String(kpis?.totalHaVap ?? 0)} color="red" size="sm" />
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases Processed Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Cases Processed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(leaderboards?.casesProcessed ?? []).map((entry, idx) => {
                                const isCurrentUser = entry.userId === currentUserId
                                const displayName = currentUserRole === 'PROCESSOR' && !isCurrentUser
                                    ? `Processor ${String.fromCharCode(65 + idx)}`
                                    : String(entry.name)

                                return (
                                    <div
                                        key={String(entry.userId)}
                                        className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20 hover:bg-muted/40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {getRankIcon(Number(entry.rank))}
                                            <div>
                                                <p className="font-medium text-sm">{displayName}</p>
                                                <p className="text-xs text-muted-foreground">{String(entry.role).replace(/_/g, ' ')}</p>
                                            </div>
                                            {isCurrentUser && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                                        </div>
                                        <span className="text-lg font-bold">{String(entry.count)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quality Score Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-500" />
                            Quality Score (FPQ%)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(leaderboards?.qualityScore ?? []).map((entry, idx) => {
                                const isCurrentUser = entry.userId === currentUserId
                                const displayName = currentUserRole === 'PROCESSOR' && !isCurrentUser
                                    ? `Processor ${String.fromCharCode(65 + idx)}`
                                    : String(entry.name)

                                return (
                                    <div
                                        key={String(entry.userId)}
                                        className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20 hover:bg-muted/40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {getRankIcon(idx + 1)}
                                            <div>
                                                <p className="font-medium text-sm">{displayName}</p>
                                                <p className="text-xs text-muted-foreground">{String(entry.role).replace(/_/g, ' ')}</p>
                                            </div>
                                            {isCurrentUser && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold">{String(entry.fpq)}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
