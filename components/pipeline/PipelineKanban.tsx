'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { getSLAColor } from '@/lib/utils'
import { WORKFLOW_STAGES } from '@/constants/workflow-stages'
import CaseDrillDownModal from '@/components/cases/CaseDrillDownModal'
import { Star, Diamond, Loader2 } from 'lucide-react'
import type { APIResponse } from '@/types'

const STAGES = ['INTAKE', 'DE', 'QC', 'MR', 'SUBMISSION', 'COMPLETED']
const STAGE_ORDER = STAGES.reduce((acc, s, i) => ({ ...acc, [s]: i }), {} as Record<string, number>)

interface CaseCard {
    id: string
    referenceId?: string
    caseNumber?: string
    productName?: string
    country?: string
    reportType?: string
    seriousness?: string
    haVapIndicator?: string
    isPregnancy?: boolean
    currentStage?: string
    slaRiskScore?: number
    daysLeft?: number
    assignedTo?: { name?: string } | null
}

function getNextStage(current: string): string | null {
    const i = STAGES.indexOf(current)
    return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null
}

function KanbanCardView({ c, className = '' }: { c: CaseCard; className?: string }) {
    const slaColor = getSLAColor(Number(c.slaRiskScore ?? 0))
    const borderClass = slaColor === 'red' ? 'border-l-red-500' : slaColor === 'amber' ? 'border-l-amber-500' : 'border-l-green-500'
    return (
        <div className={`rounded-lg border bg-card p-3 text-sm ${borderClass} border-l-4 ${className}`}>
            <p className="text-xs text-muted-foreground font-mono">{c.referenceId ?? c.caseNumber ?? c.id}</p>
            <p className="font-medium mt-0.5 truncate">{c.productName ?? '—'}</p>
            <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs">{c.country ?? ''}</span>
                {c.haVapIndicator === 'HA' && <Badge className="bg-amber-100 text-amber-800 text-[10px]"><Star className="h-3 w-3 mr-0.5" /> HA</Badge>}
                {c.haVapIndicator === 'VAP' && <Badge className="bg-blue-100 text-blue-800 text-[10px]"><Diamond className="h-3 w-3 mr-0.5" /> VAP</Badge>}
                {c.isPregnancy && <span className="text-xs">🤰</span>}
            </div>
            <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px]">{c.seriousness ?? ''}</Badge>
                <span className={`text-xs font-medium ${slaColor === 'red' ? 'text-red-600' : slaColor === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>
                    {c.daysLeft != null ? (c.daysLeft > 0 ? `${c.daysLeft}d left` : 'Breached') : '—'}
                </span>
            </div>
        </div>
    )
}

function DraggableKanbanCard({ c, onOpen }: { c: CaseCard; onOpen: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: c.id,
        data: { caseId: c.id, currentStage: c.currentStage ?? '' },
    })
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} onClick={(e) => { e.stopPropagation(); onOpen() }} className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'opacity-80 shadow-lg' : ''}`}>
            <KanbanCardView c={c} />
        </div>
    )
}

function DroppableColumn({
    stageCode,
    stageLabel,
    list,
    children,
}: { stageCode: string; stageLabel: string; list: CaseCard[]; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: stageCode })
    const haCount = list.filter((c) => c.haVapIndicator === 'HA').length
    const redCount = list.filter((c) => getSLAColor(Number(c.slaRiskScore ?? 0)) === 'red').length

    return (
        <div
            ref={setNodeRef}
            className={`w-72 shrink-0 flex flex-col rounded-lg border p-3 transition-colors ${isOver ? 'bg-primary/5 border-primary' : 'bg-muted/20'}`}
        >
            <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm font-medium">{stageLabel}</CardTitle>
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">{list.length}</Badge>
                    {haCount > 0 && <Badge className="bg-amber-100 text-amber-800 text-xs">{haCount} HA</Badge>}
                    {redCount > 0 && <Badge variant="destructive" className="text-xs">{redCount}</Badge>}
                </div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                {children}
            </div>
        </div>
    )
}

export default function PipelineKanban() {
    const queryClient = useQueryClient()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [confirmAdvance, setConfirmAdvance] = useState<{ caseId: string; refId: string; from: string; to: string } | null>(null)
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['pipeline'],
        queryFn: async () => {
            const res = await fetch('/api/pipeline')
            if (!res.ok) throw new Error('Failed to fetch pipeline')
            return res.json() as Promise<APIResponse<{ stages: string[]; casesByStage: Record<string, CaseCard[]> }>>
        },
        refetchInterval: 30000,
    })

    const advanceStage = useMutation({
        mutationFn: async ({ caseId, toStage }: { caseId: string; toStage: string }) => {
            const res = await fetch(`/api/cases/${caseId}/stage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toStage }),
            })
            if (!res.ok) throw new Error('Failed to advance stage')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipeline'] })
            queryClient.invalidateQueries({ queryKey: ['cases'] })
            setConfirmAdvance(null)
        },
    })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const stages = (data?.data?.stages as string[]) ?? STAGES
    const casesByStage = (data?.data?.casesByStage as Record<string, CaseCard[]>) ?? {}

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null)
        const caseId = String(event.active.id)
        const fromStage = event.active.data.current?.currentStage as string | undefined
        const toStage = event.over?.id as string | undefined
        if (!fromStage || !toStage || fromStage === toStage) return
        const next = getNextStage(fromStage)
        if (next !== toStage) return
        const refId = casesByStage[fromStage]?.find((x) => x.id === caseId)?.referenceId ?? caseId
        setConfirmAdvance({ caseId, refId, from: fromStage, to: toStage })
    }

    const handleConfirmAdvance = () => {
        if (!confirmAdvance) return
        advanceStage.mutate({ caseId: confirmAdvance.caseId, toStage: confirmAdvance.to })
    }

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map((s) => (
                    <div key={s} className="w-72 shrink-0 space-y-2">
                        <Skeleton className="h-12 w-full" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
                    {stages.map((stageCode) => {
                        const list = casesByStage[stageCode] ?? []
                        const stageLabel = WORKFLOW_STAGES.find((s) => s.code === stageCode)?.label ?? stageCode
                        return (
                            <DroppableColumn key={stageCode} stageCode={stageCode} stageLabel={stageLabel} list={list}>
                                {list.map((c) => (
                                    <DraggableKanbanCard
                                        key={c.id}
                                        c={c}
                                        onOpen={() => setSelectedCaseId(c.id)}
                                    />
                                ))}
                            </DroppableColumn>
                        )
                    })}
                </div>

                <DragOverlay>
                    {activeId ? (() => {
                        const stage = stages.find((s) => (casesByStage[s] ?? []).some((c) => c.id === activeId))
                        const c = stage ? casesByStage[stage].find((x) => x.id === activeId) : null
                        return c ? <KanbanCardView c={c} className="shadow-lg" /> : null
                    })() : null}
                </DragOverlay>
            </DndContext>

            <Dialog open={!!confirmAdvance} onOpenChange={(open) => !open && setConfirmAdvance(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Advance case?</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Advance case {confirmAdvance?.refId} from {confirmAdvance?.from} to {confirmAdvance?.to}?
                        </p>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAdvance(null)}>Cancel</Button>
                        <Button onClick={handleConfirmAdvance} disabled={advanceStage.isPending}>
                            {advanceStage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CaseDrillDownModal
                caseId={selectedCaseId}
                open={!!selectedCaseId}
                onClose={() => setSelectedCaseId(null)}
            />
        </>
    )
}
