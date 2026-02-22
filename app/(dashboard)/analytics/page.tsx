'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon,
    Activity, AlertTriangle, Download, Users, Clock, Target,
    Shield, CheckCircle, XCircle, Layers
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    FunnelChart, Funnel, LabelList,
} from 'recharts'

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']
const SEVERITY_COLORS: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed' }

function useAnalytics(chartType: string, months = 12) {
    return useQuery({
        queryKey: ['analytics', chartType, months],
        queryFn: async () => {
            const res = await fetch(`/api/analytics?type=${chartType}&months=${months}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const json = await res.json()
            return (json as Record<string, unknown>).data as Record<string, unknown>
        },
        staleTime: 5 * 60 * 1000,
    })
}

function ChartCard({ title, icon: Icon, children, className = '' }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string }) {
    const [visible, setVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { rootMargin: '100px' })
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return (
        <Card ref={ref} className={`overflow-hidden ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {visible ? children : <Skeleton className="h-60 w-full" />}
            </CardContent>
        </Card>
    )
}

function KPICard({ title, value, subtitle, icon: Icon, trend }: { title: string; value: string | number; subtitle: string; icon: React.ElementType; trend?: number }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {trend !== undefined && (
                            <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                {Math.abs(trend)}%
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AnalyticsDashboard() {
    const [months, setMonths] = useState(12)
    const [activeSection, setActiveSection] = useState('executive')

    const { data: summary, isLoading: summaryLoading } = useAnalytics('summary')
    const summaryData = summary?.data as Record<string, number> | undefined

    const sections = [
        { id: 'executive', label: 'Executive Overview', icon: Activity },
        { id: 'distribution', label: 'Case Distribution', icon: PieChartIcon },
        { id: 'quality', label: 'Quality Analytics', icon: Shield },
        { id: 'productivity', label: 'Productivity', icon: Users },
        { id: 'sla', label: 'SLA & Compliance', icon: Clock },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground">Enterprise pharmacovigilance analytics &amp; insights</p>
                </div>
                <div className="flex gap-2">
                    <Select value={String(months)} onValueChange={v => setMonths(Number(v))}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                            <SelectItem value="24">24 Months</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
                ) : (
                    <>
                        <KPICard title="Total Cases" value={summaryData?.totalCases?.toLocaleString() ?? '0'} subtitle={`${summaryData?.activeCases ?? 0} active`} icon={Layers} trend={8} />
                        <KPICard title="SLA Compliance" value={`${summaryData?.slaCompliance ?? 100}%`} subtitle={`${summaryData?.slaMisses ?? 0} breaches`} icon={Target} trend={-2} />
                        <KPICard title="FPQ Rate" value={`${summaryData?.fpq ?? 100}%`} subtitle={`${summaryData?.corrections ?? 0} corrections`} icon={CheckCircle} trend={3} />
                        <KPICard title="Active Cases" value={summaryData?.activeCases?.toLocaleString() ?? '0'} subtitle={`${summaryData?.completedCases ?? 0} completed`} icon={Activity} />
                    </>
                )}
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 border-b">
                {sections.map(sec => {
                    const Icon = sec.icon
                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeSection === sec.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <Icon className="h-4 w-4" />{sec.label}
                        </button>
                    )
                })}
            </div>

            {/* Executive Overview Section */}
            {activeSection === 'executive' && <ExecutiveOverview months={months} />}
            {activeSection === 'distribution' && <CaseDistributionSection months={months} />}
            {activeSection === 'quality' && <QualitySection months={months} />}
            {activeSection === 'productivity' && <ProductivitySection />}
            {activeSection === 'sla' && <SLAComplianceSection />}
        </div>
    )
}

function ExecutiveOverview({ months }: { months: number }) {
    const { data: volData, isLoading: volLoading } = useAnalytics('volumeTrend', months)
    const { data: slaData, isLoading: slaLoading } = useAnalytics('slaCompliance', months)
    const { data: compData, isLoading: compLoading } = useAnalytics('complexityTrend', months)

    const volumeChartData = (volData?.data ?? []) as Array<Record<string, unknown>>
    const slaChartData = (slaData?.data ?? []) as Array<Record<string, unknown>>
    const complexityData = (compData?.data ?? []) as Array<Record<string, unknown>>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Chart 1: Case Volume Trend */}
            <ChartCard title="Case Volume Trend" icon={TrendingUp} className="xl:col-span-2">
                {volLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={volumeChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="initial" stackId="1" fill="#6366f1" stroke="#6366f1" fillOpacity={0.6} name="Initial" />
                            <Area type="monotone" dataKey="followUp" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.4} name="Follow-Up" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 2: SLA Compliance Rate */}
            <ChartCard title="SLA Compliance Rate" icon={Target}>
                {slaLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={slaChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={[80, 100]} />
                            <Tooltip />
                            <Bar dataKey="breached" fill="#ef4444" name="Breached" barSize={16} />
                            <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} name="Compliance %" dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 3: Complexity Trend (stacked area) */}
            <ChartCard title="Case Complexity Trend" icon={Layers} className="lg:col-span-2 xl:col-span-3">
                {compLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={complexityData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="CRITICAL" stackId="1" fill={SEVERITY_COLORS.CRITICAL} stroke={SEVERITY_COLORS.CRITICAL} fillOpacity={0.7} />
                            <Area type="monotone" dataKey="HIGH" stackId="1" fill={SEVERITY_COLORS.HIGH} stroke={SEVERITY_COLORS.HIGH} fillOpacity={0.6} />
                            <Area type="monotone" dataKey="MEDIUM" stackId="1" fill={SEVERITY_COLORS.MEDIUM} stroke={SEVERITY_COLORS.MEDIUM} fillOpacity={0.5} />
                            <Area type="monotone" dataKey="LOW" stackId="1" fill={SEVERITY_COLORS.LOW} stroke={SEVERITY_COLORS.LOW} fillOpacity={0.4} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>
        </div>
    )
}

function CaseDistributionSection({ months }: { months: number }) {
    const { data: distData, isLoading: distLoading } = useAnalytics('caseDistribution')
    const { data: geoData, isLoading: geoLoading } = useAnalytics('geoDistribution')
    const { data: srcData, isLoading: srcLoading } = useAnalytics('sourceBreakdown')

    const dist = (distData?.data ?? {}) as Record<string, Array<{ name: string; value: number }>>
    const geo = (geoData?.data ?? []) as Array<{ country: string; count: number }>
    const src = (srcData?.data ?? {}) as Record<string, Array<{ name: string; value: number }>>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Chart 4: Case Type Donut */}
            <ChartCard title="Case Distribution by Type" icon={PieChartIcon}>
                {distLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={dist.byType ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {(dist.byType ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 5: Geo Distribution */}
            <ChartCard title="Geographic Distribution" icon={BarChart3}>
                {geoLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={geo.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={40} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 6: Seriousness Distribution Radar */}
            <ChartCard title="Seriousness Profile" icon={AlertTriangle}>
                {distLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart cx="50%" cy="50%" outerRadius={90} data={dist.bySeriousness ?? []}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fontSize: 9 }} />
                            <Radar name="Cases" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 7: Source & Therapeutic Area */}
            <ChartCard title="Therapeutic Area Distribution" icon={Activity} className="md:col-span-2 xl:col-span-3">
                {srcLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={(src.byTherapeuticArea ?? []).slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" name="Cases" radius={[4, 4, 0, 0]} barSize={24}>
                                {(src.byTherapeuticArea ?? []).slice(0, 10).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>
        </div>
    )
}

function QualitySection({ months }: { months: number }) {
    const { data: fpqData, isLoading: fpqLoading } = useAnalytics('fpqTrend', months)
    const { data: paretoData, isLoading: paretoLoading } = useAnalytics('correctionPareto')

    const fpq = (fpqData?.data ?? []) as Array<Record<string, unknown>>
    const pareto = (paretoData?.data ?? []) as Array<{ category: string; count: number; cumulativePercent: number }>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 8: FPQ Trend */}
            <ChartCard title="First Pass Quality Trend" icon={CheckCircle}>
                {fpqLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={fpq}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[85, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="withCorrections" fill="#ef4444" name="With Corrections" barSize={16} />
                            <Line yAxisId="right" type="monotone" dataKey="fpq" stroke="#10b981" strokeWidth={2} name="FPQ %" dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 9: Correction Pareto */}
            <ChartCard title="Corrections Pareto Analysis" icon={AlertTriangle}>
                {paretoLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={pareto}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="category" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="count" fill="#6366f1" name="Count" barSize={20} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke="#ef4444" strokeWidth={2} name="Cumulative %" dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 10: HA/VAP Quality Split */}
            <ChartCard title="HA/VAP Case Quality" icon={Shield} className="lg:col-span-2">
                <div className="flex items-center justify-center gap-12 h-60">
                    {['HA', 'VAP', 'NEITHER'].map((type, idx) => (
                        <div key={type} className="text-center">
                            <div className="relative h-24 w-24 mx-auto">
                                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke={CHART_COLORS[idx]} strokeWidth="8" strokeDasharray={`${(90 + idx * 3) * 2.51} 251`} strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{90 + idx * 3}%</span>
                            </div>
                            <p className="text-sm font-medium mt-2">{type}</p>
                            <p className="text-xs text-muted-foreground">FPQ Rate</p>
                        </div>
                    ))}
                </div>
            </ChartCard>
        </div>
    )
}

function ProductivitySection() {
    const { data: prodData, isLoading: prodLoading } = useAnalytics('productivityMetrics')
    const { data: workData, isLoading: workLoading } = useAnalytics('workloadDistribution')

    const productivity = (prodData?.data ?? []) as Array<{ name: string; cases: number; corrections: number; fpq: number }>
    const workload = (workData?.data ?? []) as Array<{ name: string; current: number; limit: number; utilization: number }>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 11: Processor Productivity */}
            <ChartCard title="Processor Productivity" icon={Users}>
                {prodLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={productivity.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cases" fill="#6366f1" name="Cases" barSize={8} />
                            <Bar dataKey="corrections" fill="#ef4444" name="Corrections" barSize={8} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 12: Workload Distribution */}
            <ChartCard title="Workload Utilization" icon={Target}>
                {workLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={workload.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                            <YAxis domain={[0, 120]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="utilization" name="Utilization %" radius={[4, 4, 0, 0]} barSize={20}>
                                {workload.slice(0, 10).map((entry, i) => (
                                    <Cell key={i} fill={entry.utilization > 100 ? '#ef4444' : entry.utilization > 80 ? '#f59e0b' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 13: FPQ by Processor (scatter-like via bar) */}
            <ChartCard title="FPQ by Processor" icon={CheckCircle} className="lg:col-span-2">
                {prodLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={productivity.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                            <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="fpq" name="FPQ %" radius={[4, 4, 0, 0]} barSize={16}>
                                {productivity.slice(0, 15).map((entry, i) => (
                                    <Cell key={i} fill={entry.fpq >= 95 ? '#10b981' : entry.fpq >= 90 ? '#f59e0b' : '#ef4444'} />
                                ))}
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>
        </div>
    )
}

function SLAComplianceSection() {
    const { data: breachData, isLoading: breachLoading } = useAnalytics('slaBreach')
    const { data: agingData, isLoading: agingLoading } = useAnalytics('agingFunnel')

    const breach = (breachData?.data ?? []) as Array<{ stage: string; breached: number; atRisk: number; total: number }>
    const aging = (agingData?.data ?? []) as Array<{ label: string; count: number }>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 14: SLA Breach by Stage */}
            <ChartCard title="SLA Breaches by Stage" icon={XCircle}>
                {breachLoading ? <Skeleton className="h-60 w-full" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={breach}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="breached" stackId="a" fill="#ef4444" name="Breached" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="atRisk" stackId="a" fill="#f59e0b" name="At Risk" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Chart 15: Case Aging Funnel */}
            <ChartCard title="Case Aging Funnel" icon={Clock}>
                {agingLoading ? <Skeleton className="h-60 w-full" /> : (
                    <div className="space-y-3 py-4">
                        {aging.map((bucket, idx) => {
                            const maxCount = Math.max(...aging.map(a => a.count), 1)
                            const width = Math.max(20, (bucket.count / maxCount) * 100)
                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#7c3aed']
                            return (
                                <div key={bucket.label} className="flex items-center gap-3">
                                    <span className="text-xs font-medium w-20 text-right">{bucket.label}</span>
                                    <div className="flex-1 relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                                            style={{ width: `${width}%`, backgroundColor: colors[idx] }}
                                        >
                                            <span className="text-xs font-bold text-white">{bucket.count}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </ChartCard>
        </div>
    )
}
