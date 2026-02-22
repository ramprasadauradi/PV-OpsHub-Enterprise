'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Settings, Save, CheckCircle, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface GovernanceSettings {
    holdAutoReleaseHours: number
    maxReassignments: number
    capaThreshold: number
    fpqMinThreshold: number
    defaultDailyCaseLimit: number
    haPriorityMultiplier: number
}

export default function GovernancePage() {
    const queryClient = useQueryClient()
    const [saved, setSaved] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'governance'],
        queryFn: async () => {
            const res = await fetch('/api/admin/governance')
            if (!res.ok) throw new Error('Failed to fetch settings')
            return res.json() as Promise<{ data: GovernanceSettings }>
        },
    })

    const settings = data?.data

    const [form, setForm] = useState<Partial<GovernanceSettings>>({})

    const getValue = (key: keyof GovernanceSettings): number => {
        return form[key] ?? settings?.[key] ?? 0
    }

    const handleChange = (key: keyof GovernanceSettings, value: string) => {
        setForm((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }))
    }

    const saveSettings = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/admin/governance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    holdAutoReleaseHours: getValue('holdAutoReleaseHours'),
                    maxReassignments: getValue('maxReassignments'),
                    capaThreshold: getValue('capaThreshold'),
                    fpqMinThreshold: getValue('fpqMinThreshold'),
                }),
            })
            if (!res.ok) throw new Error('Failed to save')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'governance'] })
            setSaved(true)
            setForm({})
            setTimeout(() => setSaved(false), 3000)
        },
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Governance Settings</h1>
                    <p className="text-muted-foreground">Server-side enforcement of allocation limits and thresholds</p>
                </div>
                <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
                    {saveSettings.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Saved!</>
                    ) : (
                        <><Save className="h-4 w-4 mr-2" /> Save</>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" /> Allocation Limits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Default Daily Case Limit (per processor)</Label>
                            <Input type="number" value={getValue('defaultDailyCaseLimit')} onChange={(e) => handleChange('defaultDailyCaseLimit', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Max Reassignment Count (per case)</Label>
                            <Input type="number" value={getValue('maxReassignments')} onChange={(e) => handleChange('maxReassignments', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>HA/VAP Priority Multiplier</Label>
                            <Input type="number" value={getValue('haPriorityMultiplier')} step={0.1} onChange={(e) => handleChange('haPriorityMultiplier', e.target.value)} className="mt-1" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-5 w-5" /> Quality Thresholds
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>CAPA Auto-Trigger Threshold</Label>
                            <Input type="number" value={getValue('capaThreshold')} onChange={(e) => handleChange('capaThreshold', e.target.value)} className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">Number of corrections in 30 days before CAPA triggers</p>
                        </div>
                        <div>
                            <Label>Hold Auto-Release (hours)</Label>
                            <Input type="number" value={getValue('holdAutoReleaseHours')} onChange={(e) => handleChange('holdAutoReleaseHours', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>FPQ Target (%)</Label>
                            <Input type="number" value={getValue('fpqMinThreshold')} onChange={(e) => handleChange('fpqMinThreshold', e.target.value)} className="mt-1" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
