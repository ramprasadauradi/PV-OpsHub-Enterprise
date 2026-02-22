'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Plus, Shield, FlaskConical } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

interface SLARule {
    id: string
    configName: string
    country: string
    licensePartner: string
    reportType: string
    seriousness: string
    haVapIndicator: string
    submissionDays: number
    useBusinessDays: boolean
    clockStopAllowed: boolean
    maxClockStops: number
    priority: number
    effectiveDate: string
    expiryDate: string | null
    isActive: boolean
    version: number
    notes: string | null
}

const COUNTRIES = ['DEFAULT', 'US', 'DE', 'GB', 'JP', 'IN', 'FR', 'AU', 'CA', 'CH', 'KR', 'BR']
const SERIOUSNESS = ['ALL', 'FATAL', 'LIFE_THREATENING', 'SERIOUS', 'NON_SERIOUS']
const VAP_INDICATORS = ['ALL', 'HA', 'VAP', 'NEITHER']

export default function SLAConfigPage() {
    const [showAddForm, setShowAddForm] = useState(false)
    const [testCase, setTestCase] = useState({ country: 'US', seriousness: 'SERIOUS', haVap: 'HA' })
    const [showTestResult, setShowTestResult] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'sla-config'],
        queryFn: async () => {
            const res = await fetch('/api/admin/sla-config')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const createMutation = useMutation({
        mutationFn: async (rule: Record<string, unknown>) => {
            const res = await fetch('/api/admin/sla-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) })
            if (!res.ok) throw new Error('Failed to create')
            return res.json()
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'sla-config'] }); setShowAddForm(false) },
    })

    const responseData = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined
    const configs: SLARule[] = (responseData?.configs as SLARule[]) ?? []
    const activeRules = configs.filter(c => c.isActive)
    const vapRules = activeRules.filter(c => c.haVapIndicator === 'VAP')

    const handleAddRule = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        createMutation.mutate({
            configName: fd.get('configName'),
            country: fd.get('country'),
            seriousness: fd.get('seriousness'),
            haVapIndicator: fd.get('haVapIndicator'),
            submissionDays: parseInt(fd.get('submissionDays') as string),
            priority: parseInt(fd.get('priority') as string),
            useBusinessDays: fd.get('useBusinessDays') === 'on',
            effectiveDate: new Date().toISOString(),
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        SLA Configuration
                    </h1>
                    <p className="text-muted-foreground">{activeRules.length} active rules · Priority-based resolution with country + VAP support</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowTestResult(!showTestResult)}>
                        <FlaskConical className="h-4 w-4 mr-2" />Test Rule
                    </Button>
                    <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-2" />Add Rule
                    </Button>
                </div>
            </div>

            {/* Test Rule Panel */}
            {showTestResult && (
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader><CardTitle className="text-sm">Test SLA Rule Resolution</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end flex-wrap">
                            <div>
                                <label className="text-xs font-medium">Country</label>
                                <Select value={testCase.country} onValueChange={v => setTestCase({ ...testCase, country: v })}>
                                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium">Seriousness</label>
                                <Select value={testCase.seriousness} onValueChange={v => setTestCase({ ...testCase, seriousness: v })}>
                                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>{SERIOUSNESS.filter(s => s !== 'ALL').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium">HA/VAP</label>
                                <Select value={testCase.haVap} onValueChange={v => setTestCase({ ...testCase, haVap: v })}>
                                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>{VAP_INDICATORS.filter(v => v !== 'ALL').map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border">
                                <p className="text-xs text-muted-foreground">Matching Rule</p>
                                <p className="text-sm font-medium">
                                    {(() => {
                                        const matching = activeRules.filter(r =>
                                            (r.country === testCase.country || r.country === 'DEFAULT') &&
                                            (r.seriousness === testCase.seriousness || r.seriousness === 'ALL') &&
                                            (r.haVapIndicator === testCase.haVap || r.haVapIndicator === 'ALL')
                                        ).sort((a, b) => b.priority - a.priority)
                                        return matching[0]?.configName ?? 'System Default (no match)'
                                    })()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Deadline: {(() => {
                                        const matching = activeRules.filter(r =>
                                            (r.country === testCase.country || r.country === 'DEFAULT') &&
                                            (r.seriousness === testCase.seriousness || r.seriousness === 'ALL') &&
                                            (r.haVapIndicator === testCase.haVap || r.haVapIndicator === 'ALL')
                                        ).sort((a, b) => b.priority - a.priority)
                                        return matching[0]?.submissionDays ?? 15
                                    })()} days
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Rule Form */}
            {showAddForm && (
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader><CardTitle className="text-sm">Add New SLA Rule</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddRule} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="text-xs font-medium">Rule Name*</label><Input name="configName" required placeholder="US Serious HA" /></div>
                            <div>
                                <label className="text-xs font-medium">Country</label>
                                <select name="country" className="w-full h-10 rounded-md border px-3 text-sm" defaultValue="DEFAULT">
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium">Seriousness</label>
                                <select name="seriousness" className="w-full h-10 rounded-md border px-3 text-sm" defaultValue="ALL">
                                    {SERIOUSNESS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium">HA/VAP Indicator</label>
                                <select name="haVapIndicator" className="w-full h-10 rounded-md border px-3 text-sm" defaultValue="ALL">
                                    {VAP_INDICATORS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div><label className="text-xs font-medium">Submission Days*</label><Input name="submissionDays" type="number" required defaultValue="15" /></div>
                            <div><label className="text-xs font-medium">Priority*</label><Input name="priority" type="number" required defaultValue="50" /></div>
                            <div className="flex items-end gap-2">
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="useBusinessDays" className="rounded" /> Business Days</label>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit" size="sm" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save Rule'}</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Active Rules Table */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Active SLA Rules ({activeRules.length})</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : activeRules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No SLA Rules Configured</h3>
                            <p className="text-sm mt-1">Add your first SLA rule to start configuring submission deadlines.</p>
                            <Button className="mt-4" onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="p-3 text-left font-medium">Rule Name</th>
                                        <th className="p-3 text-left font-medium">Country</th>
                                        <th className="p-3 text-left font-medium">Seriousness</th>
                                        <th className="p-3 text-left font-medium">HA/VAP</th>
                                        <th className="p-3 text-left font-medium">Days</th>
                                        <th className="p-3 text-left font-medium">Priority</th>
                                        <th className="p-3 text-left font-medium">Effective</th>
                                        <th className="p-3 text-left font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeRules.map(rule => (
                                        <tr key={rule.id} className="border-b hover:bg-muted/20">
                                            <td className="p-3 font-medium">{rule.configName}</td>
                                            <td className="p-3"><Badge variant="outline">{rule.country}</Badge></td>
                                            <td className="p-3"><Badge variant="outline">{rule.seriousness}</Badge></td>
                                            <td className="p-3">
                                                <Badge variant={rule.haVapIndicator === 'HA' ? 'destructive' : rule.haVapIndicator === 'VAP' ? 'warning' : 'outline'}>
                                                    {rule.haVapIndicator}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-mono">{rule.submissionDays}{rule.useBusinessDays ? ' BD' : ' CD'}</td>
                                            <td className="p-3 font-mono">{rule.priority}</td>
                                            <td className="p-3 text-xs text-muted-foreground">{formatDate(new Date(rule.effectiveDate))}</td>
                                            <td className="p-3"><Badge variant="success">v{rule.version}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* VAP-Specific Rules */}
            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-500" />
                        VAP-Specific Rules ({vapRules.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {vapRules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No VAP-specific rules configured. Add VAP rules for tighter compliance.</p>
                            <div className="flex gap-2 justify-center mt-4">
                                {['US', 'EU', 'JP'].map(region => (
                                    <Button key={region} variant="outline" size="sm" onClick={() => {
                                        setShowAddForm(true)
                                    }}>Add VAP Rule for {region}</Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vapRules.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                                    <div>
                                        <p className="text-sm font-medium">{rule.configName}</p>
                                        <p className="text-xs text-muted-foreground">{rule.country} · {rule.seriousness} · {rule.submissionDays} days · Priority {rule.priority}</p>
                                    </div>
                                    <Badge variant="warning">VAP</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
