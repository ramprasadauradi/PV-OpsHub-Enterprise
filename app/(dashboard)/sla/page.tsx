'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, AlertTriangle } from 'lucide-react'
import { useBreachForecast } from '@/hooks/useSLA'

const SLAHeatmap = dynamic(() => import('@/components/sla/SLAHeatmap'), { ssr: false })

export default function SLAPage() {
    const { data: forecastData, isLoading: forecastLoading } = useBreachForecast()
    const forecast = ((forecastData as unknown as { data?: { forecast?: Array<Record<string, unknown>> } })?.data?.forecast) ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">SLA Management</h1>
                <p className="text-muted-foreground">Monitor SLA compliance across pipeline stages</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        SLA Heatmap (Stages × Risk)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SLAHeatmap />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        7-Day Breach Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {forecastLoading ? (
                        <div className="grid grid-cols-7 gap-3">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-3">
                            {forecast.map((day) => (
                                <div key={String(day.date)} className={`text-center p-4 rounded-xl border transition-all ${String(day.riskLevel) === 'red' ? 'border-red-200 bg-red-50' : String(day.riskLevel) === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                                    <p className="text-xs text-muted-foreground">{new Date(String(day.date)).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className="text-2xl font-bold mt-1">{String(day.predictedBreaches)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase mt-1">breaches</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
