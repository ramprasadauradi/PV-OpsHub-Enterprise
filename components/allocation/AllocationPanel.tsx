'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCases, useAllocateCase } from '@/hooks/useCases'
import { useAvailableProcessors } from '@/hooks/useAllocation'
import { getSLAColor } from '@/lib/utils'
import { Target, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import KPICard from '@/components/dashboard/widgets/KPICard'

interface CaseRow {
    id: string
    referenceId?: string
    caseNumber?: string
    country?: string
    reportType?: string
    haVapIndicator?: string
    slaRiskScore?: number
}

interface ProcessorRow {
    id: string
    name?: string
    dailyCaseLimit?: number
    capacity?: { daily?: number; remaining?: number }
}

interface AllocationPanelProps {
    /** Optional initial filter (e.g. currentStatus: 'UNALLOCATED') */
    caseFilter?: Record<string, string>
    /** Show "Select All" in header */
    showSelectAll?: boolean
}

export default function AllocationPanel({ caseFilter = { currentStatus: 'UNALLOCATED' }, showSelectAll = true }: AllocationPanelProps) {
    const [selectedCases, setSelectedCases] = React.useState<string[]>([])
    const [selectedProcessor, setSelectedProcessor] = React.useState('')
    const { data: casesData, isLoading: casesLoading } = useCases(caseFilter)
    const { data: processorsData, isLoading: processorsLoading } = useAvailableProcessors()
    const allocateMutation = useAllocateCase()

    const unallocatedCases = ((casesData as unknown as { data?: CaseRow[] })?.data) ?? []
    const processors = ((processorsData as unknown as { data?: ProcessorRow[] })?.data) ?? []

    const handleAllocate = async () => {
        if (selectedCases.length === 0 || !selectedProcessor) return
        await allocateMutation.mutateAsync({ caseIds: selectedCases, assignToUserId: selectedProcessor })
        setSelectedCases([])
        setSelectedProcessor('')
    }

    const toggleCase = (id: string) => {
        setSelectedCases((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        if (selectedCases.length === unallocatedCases.length) {
            setSelectedCases([])
        } else {
            setSelectedCases(unallocatedCases.map((c) => c.id))
        }
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-4">
                <KPICard label="Unallocated" value={String(unallocatedCases.length)} icon={<Target className="h-5 w-5" />} color="amber" />
                <KPICard label="Available Processors" value={String(processors.length)} icon={<Users className="h-5 w-5" />} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Unallocated Cases</span>
                            <div className="flex items-center gap-2">
                                {showSelectAll && unallocatedCases.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={selectAll}>
                                        {selectedCases.length === unallocatedCases.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                                {selectedCases.length > 0 && (
                                    <Badge variant="secondary">{selectedCases.length} selected</Badge>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {casesLoading ? (
                            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {unallocatedCases.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => toggleCase(c.id)}
                                        className={`flex items-center justify-between rounded-md border p-3 text-sm cursor-pointer transition-all ${selectedCases.includes(c.id) ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/30'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={selectedCases.includes(c.id)} readOnly className="rounded" />
                                            <div>
                                                <p className="font-medium">{c.referenceId ?? c.caseNumber ?? c.id}</p>
                                                <p className="text-xs text-muted-foreground">{c.country ?? ''} · {c.reportType ?? ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {c.haVapIndicator && c.haVapIndicator !== 'NEITHER' && (
                                                <Badge variant="destructive" className="text-[10px]">{c.haVapIndicator}</Badge>
                                            )}
                                            <Badge variant={getSLAColor(Number(c.slaRiskScore ?? 0)) === 'green' ? 'success' : getSLAColor(Number(c.slaRiskScore ?? 0)) === 'red' ? 'destructive' : 'warning'}>
                                                {Math.round(Number(c.slaRiskScore ?? 0))}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {unallocatedCases.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                        All cases allocated
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Assign To</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedProcessor} onValueChange={setSelectedProcessor}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select processor" />
                            </SelectTrigger>
                            <SelectContent>
                                {processors.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{p.name ?? p.id}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                Cap: {p.capacity?.remaining ?? '?'}/{p.dailyCaseLimit ?? '?'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            className="w-full"
                            onClick={handleAllocate}
                            disabled={selectedCases.length === 0 || !selectedProcessor || allocateMutation.isPending}
                        >
                            {allocateMutation.isPending ? 'Allocating...' : `Allocate ${selectedCases.length} Case(s)`}
                        </Button>

                        {allocateMutation.isError && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                Allocation failed. Check governance limits.
                            </div>
                        )}

                        <div className="mt-6 space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Processor Capacity</h4>
                            {processorsLoading ? (
                                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                            ) : (
                                processors.map((p) => {
                                    const cap = p.capacity
                                    const used = (cap?.daily ?? 0) - (cap?.remaining ?? 0)
                                    const total = Number(p.dailyCaseLimit ?? 10)
                                    const pct = total > 0 ? (used / total) * 100 : 0
                                    return (
                                        <div key={p.id} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium">{p.name ?? p.id}</span>
                                                <span className="text-muted-foreground">{used}/{total}</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
