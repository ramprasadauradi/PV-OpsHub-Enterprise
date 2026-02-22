'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Workflow, Plus, RotateCcw, GripVertical } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface WorkflowStage {
    id: string
    stageCode: string
    stageLabel: string
    stageOrder: number
    isEnabled: boolean
    color: string
    slaDays: number | null
    isRequired: boolean
    description: string | null
}

export default function WorkflowBuilderPage() {
    const [showAddForm, setShowAddForm] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'workflow'],
        queryFn: async () => {
            const res = await fetch('/api/admin/workflow')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const resetMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/admin/workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' }),
            })
            if (!res.ok) throw new Error('Failed to reset')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workflow'] }),
    })

    const addMutation = useMutation({
        mutationFn: async (stage: Record<string, unknown>) => {
            const res = await fetch('/api/admin/workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stage),
            })
            if (!res.ok) throw new Error('Failed to add')
            return res.json()
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'workflow'] }); setShowAddForm(false) },
    })

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
            const res = await fetch('/api/admin/workflow', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isEnabled }),
            })
            if (!res.ok) throw new Error('Failed to toggle')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workflow'] }),
    })

    const responseData = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined
    const stages: WorkflowStage[] = (responseData?.stages as WorkflowStage[]) ?? []

    const handleAddStage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const label = fd.get('stageLabel') as string
        addMutation.mutate({
            stageCode: label.toUpperCase().replace(/\s+/g, '_'),
            stageLabel: label,
            color: fd.get('color') || '#6b7280',
            slaDays: fd.get('slaDays') ? parseInt(fd.get('slaDays') as string) : null,
            isRequired: fd.get('isRequired') === 'on',
            description: fd.get('description') || null,
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Workflow className="h-6 w-6" />
                        Workflow Builder
                    </h1>
                    <p className="text-muted-foreground">Configure case processing stages for your tenant</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
                        <RotateCcw className="h-4 w-4 mr-2" />{resetMutation.isPending ? 'Resetting...' : 'Reset to Default'}
                    </Button>
                    <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-2" />Add Stage
                    </Button>
                </div>
            </div>

            {/* Visual Pipeline */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Workflow Pipeline</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-48 shrink-0 rounded-lg" />)}
                        </div>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto pb-4 items-center">
                            {stages.map((stage, idx) => (
                                <React.Fragment key={stage.id}>
                                    <div
                                        className={`shrink-0 rounded-lg border-2 p-4 min-w-[160px] transition-all ${stage.isEnabled ? 'bg-card shadow-sm' : 'bg-muted/50 opacity-50'
                                            }`}
                                        style={{ borderColor: stage.isEnabled ? stage.color : '#d1d5db' }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                            <span className="text-xs font-mono text-muted-foreground">{stage.stageOrder}</span>
                                        </div>
                                        <p className="font-medium text-sm">{stage.stageLabel}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{stage.stageCode}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {stage.isRequired && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                                            {stage.slaDays && <Badge variant="outline" className="text-[10px]">{stage.slaDays}d SLA</Badge>}
                                            <button
                                                onClick={() => toggleMutation.mutate({ id: stage.id, isEnabled: !stage.isEnabled })}
                                                className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                                            >
                                                {stage.isEnabled ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>
                                    {idx < stages.length - 1 && (
                                        <div className="text-muted-foreground shrink-0">→</div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Stage Form */}
            {showAddForm && (
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader><CardTitle className="text-sm">Add New Stage</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddStage} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="text-xs font-medium">Stage Label*</label><Input name="stageLabel" required placeholder="Medical Coding" /></div>
                            <div><label className="text-xs font-medium">Color</label><Input name="color" type="color" defaultValue="#6b7280" className="h-10" /></div>
                            <div><label className="text-xs font-medium">SLA Days (optional)</label><Input name="slaDays" type="number" placeholder="3" /></div>
                            <div><label className="text-xs font-medium">Description</label><Input name="description" placeholder="Stage description" /></div>
                            <div className="flex items-end gap-4">
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isRequired" className="rounded" /> Required</label>
                            </div>
                            <div className="flex items-end gap-2 col-span-2 md:col-span-1">
                                <Button type="submit" size="sm" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Stage'}</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Stage Details Table */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Stage Details</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-3 text-left font-medium">Order</th>
                                    <th className="p-3 text-left font-medium">Code</th>
                                    <th className="p-3 text-left font-medium">Label</th>
                                    <th className="p-3 text-left font-medium">Color</th>
                                    <th className="p-3 text-left font-medium">SLA</th>
                                    <th className="p-3 text-left font-medium">Required</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stages.map(stage => (
                                    <tr key={stage.id} className={`border-b hover:bg-muted/20 ${!stage.isEnabled ? 'opacity-50' : ''}`}>
                                        <td className="p-3 font-mono text-xs">{stage.stageOrder}</td>
                                        <td className="p-3 font-mono text-xs">{stage.stageCode}</td>
                                        <td className="p-3 font-medium">{stage.stageLabel}</td>
                                        <td className="p-3"><div className="h-4 w-4 rounded" style={{ backgroundColor: stage.color }} /></td>
                                        <td className="p-3">{stage.slaDays ? `${stage.slaDays} days` : '—'}</td>
                                        <td className="p-3">{stage.isRequired ? <Badge variant="outline">Required</Badge> : '—'}</td>
                                        <td className="p-3">
                                            <Badge variant={stage.isEnabled ? 'success' : 'secondary'}>{stage.isEnabled ? 'Active' : 'Disabled'}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
