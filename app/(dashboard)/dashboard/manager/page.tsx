'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import KPICard from '@/components/dashboard/widgets/KPICard'
import { useManagerDashboard } from '@/hooks/useDashboard'
import { Users, BarChart3, Shield, XCircle, CheckCircle } from 'lucide-react'

export default function ManagerDashboardPage() {
    const { data, isLoading, error } = useManagerDashboard()
    const dashData = (data as unknown as { data?: Record<string, unknown> })?.data

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold">Failed to load manager dashboard</h3>
                </div>
            </div>
        )
    }

    const teams = dashData?.teams as Array<Record<string, unknown>> ?? []
    const totalActive = dashData?.totalActive as number ?? 0
    const totalCompleted = dashData?.totalCompleted as number ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
                <p className="text-muted-foreground">Cross-team performance overview</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KPICard label="Active Cases" value={String(totalActive)} icon={<BarChart3 className="h-5 w-5" />} color="blue" />
                <KPICard label="Completed" value={String(totalCompleted)} icon={<CheckCircle className="h-5 w-5" />} color="green" />
                <KPICard label="Teams" value={String(teams.length)} icon={<Users className="h-5 w-5" />} color="purple" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">Team Lead</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-center">Members</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-center">Allocated</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-center">Completed</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-center">Corrections</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-center">FPQ %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team) => (
                                    <tr key={String((team.teamLead as Record<string, unknown>)?.id)} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="py-3 font-medium">{String((team.teamLead as Record<string, unknown>)?.name)}</td>
                                        <td className="py-3 text-center">{String(team.memberCount)}</td>
                                        <td className="py-3 text-center">{String(team.allocated)}</td>
                                        <td className="py-3 text-center">{String(team.completed)}</td>
                                        <td className="py-3 text-center">{String(team.corrections)}</td>
                                        <td className="py-3 text-center">
                                            <span className={`font-semibold ${Number(team.fpq) >= 95 ? 'text-green-600' : Number(team.fpq) >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {String(team.fpq)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {teams.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">No team data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
