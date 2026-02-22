'use client'

import React, { useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase } from '@/hooks/useCases'
import { formatDate, formatDateTime, getSLAColor } from '@/lib/utils'
import { getStatusMeta } from '@/constants/workflow-stages'
import { X, FileText, GitBranch, AlertCircle, History, ScrollText } from 'lucide-react'

interface CaseDrillDownModalProps {
    caseId: string | null
    open: boolean
    onClose: () => void
    userRole?: string
}

export default function CaseDrillDownModal({
    caseId,
    open,
    onClose,
    userRole = 'TEAM_LEAD',
}: CaseDrillDownModalProps) {
    const { data, isLoading, error } = useCase(caseId ?? '')
    const caseData = (data as { data?: Record<string, unknown> })?.data

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (open) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [open, onClose])

    if (!open) return null

    const slaVariant = caseData ? (getSLAColor(Number(caseData.slaRiskScore ?? 0)) === 'red' ? 'destructive' : getSLAColor(Number(caseData.slaRiskScore ?? 0)) === 'amber' ? 'secondary' : 'default') : 'outline'

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent
                className="fixed right-0 top-0 bottom-0 left-auto w-full max-w-2xl translate-x-0 translate-y-0 max-h-none rounded-l-lg rounded-r-none overflow-y-auto"
            >
                <DialogHeader className="border-b pb-4">
                    {isLoading && (
                        <Skeleton className="h-8 w-48" />
                    )}
                    {error && (
                        <p className="text-sm text-destructive">Failed to load case</p>
                    )}
                    {caseData && !isLoading && (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-xl font-bold">
                                        {String(caseData.referenceId ?? '')}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {String(caseData.caseNumber ?? '')}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge style={{ backgroundColor: getStatusMeta(String(caseData.currentStatus ?? '')).bgColor, color: getStatusMeta(String(caseData.currentStatus ?? '')).color }}>
                                    {getStatusMeta(String(caseData.currentStatus ?? '')).label}
                                </Badge>
                                <Badge variant="outline">{String(caseData.currentStage ?? '')}</Badge>
                                <Badge variant={slaVariant}>
                                    SLA {Math.round(Number(caseData.slaRiskScore ?? 0))}%
                                </Badge>
                                {String(caseData.haVapIndicator) !== 'NEITHER' && (
                                    <Badge variant="destructive">{String(caseData.haVapIndicator)}</Badge>
                                )}
                            </div>
                        </>
                    )}
                </DialogHeader>

                {caseData && (
                    <Tabs defaultValue="overview" className="mt-6">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
                            <TabsTrigger value="workflow" className="text-xs"><GitBranch className="h-3.5 w-3.5 mr-1" /> Workflow</TabsTrigger>
                            <TabsTrigger value="corrections" className="text-xs"><AlertCircle className="h-3.5 w-3.5 mr-1" /> Corrections</TabsTrigger>
                            <TabsTrigger value="allocation" className="text-xs"><History className="h-3.5 w-3.5 mr-1" /> Allocation</TabsTrigger>
                            <TabsTrigger value="audit" className="text-xs"><ScrollText className="h-3.5 w-3.5 mr-1" /> Audit</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted-foreground">Product</span><br />{String(caseData.productName ?? '—')}</div>
                                <div><span className="text-muted-foreground">Therapeutic Area</span><br />{String(caseData.therapeuticArea ?? '—')}</div>
                                <div><span className="text-muted-foreground">Country</span><br />{String(caseData.country ?? '—')}</div>
                                <div><span className="text-muted-foreground">Source</span><br />{String(caseData.source ?? '—')}</div>
                                <div><span className="text-muted-foreground">Report Type</span><br />{String(caseData.reportType ?? '—')}</div>
                                <div><span className="text-muted-foreground">Seriousness</span><br />{String(caseData.seriousness ?? '—')}</div>
                                <div><span className="text-muted-foreground">MRD</span><br />{caseData.manufacturerReceiptDate ? formatDate(new Date(String(caseData.manufacturerReceiptDate))) : '—'}</div>
                                <div><span className="text-muted-foreground">CRD</span><br />{caseData.centralReceiptDate ? formatDate(new Date(String(caseData.centralReceiptDate))) : '—'}</div>
                                <div><span className="text-muted-foreground">SLA Deadline</span><br />{caseData.slaDeadline ? formatDate(new Date(String(caseData.slaDeadline))) : '—'}</div>
                                <div><span className="text-muted-foreground">Assigned To</span><br />
                                    {(caseData.allocations as Array<{ isActive?: boolean; assignedTo?: { name?: string } }>)?.find((a) => a.isActive)?.assignedTo?.name ?? 'Unassigned'}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="workflow" className="mt-4">
                            <div className="space-y-2">
                                {((caseData.stageEvents as Array<Record<string, unknown>>) ?? []).map((ev, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                                        <Badge variant="outline">{String(ev.toStage ?? '')}</Badge>
                                        <span className="text-muted-foreground">
                                            {ev.createdAt ? formatDateTime(new Date(String(ev.createdAt))) : ''}
                                        </span>
                                        {(ev.performedBy as { name?: string })?.name != null && (
                                            <span>— {String((ev.performedBy as { name: string }).name)}</span>
                                        )}
                                    </div>
                                ))}
                                {((caseData.stageEvents as unknown[]) ?? []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No stage events</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="corrections" className="mt-4">
                            <div className="space-y-2">
                                {((caseData.corrections as Array<Record<string, unknown>>) ?? []).map((c, i) => (
                                    <div key={i} className="rounded-md border p-3 text-sm">
                                        <div className="flex justify-between">
                                            <Badge variant="secondary">{String(c.category ?? '')}</Badge>
                                            {c.createdAt != null && <span className="text-muted-foreground">{formatDate(new Date(String(c.createdAt)))}</span>}
                                        </div>
                                        <p className="mt-1">{String(c.description ?? '')}</p>
                                        {(c.correctedBy as { name?: string })?.name != null && (
                                            <p className="text-xs text-muted-foreground mt-1">By {String((c.correctedBy as { name: string }).name)}</p>
                                        )}
                                    </div>
                                ))}
                                {((caseData.corrections as unknown[]) ?? []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No corrections</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="allocation" className="mt-4">
                            <div className="space-y-2">
                                {((caseData.allocations as Array<Record<string, unknown>>) ?? []).map((a, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                        <span>{`#${Number(a.allocationNum) || i + 1}`}</span>
                                        <span>{String((a.allocatedBy as { name?: string })?.name ?? '—')} → {String((a.assignedTo as { name?: string })?.name ?? '—')}</span>
                                        {a.allocatedAt != null && <span className="text-muted-foreground">{formatDateTime(new Date(String(a.allocatedAt)))}</span>}
                                    </div>
                                ))}
                                {((caseData.allocations as unknown[]) ?? []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No allocation history</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="audit" className="mt-4">
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {((caseData.auditTrail as Array<Record<string, unknown>>) ?? []).map((a, i) => (
                                    <div key={i} className="rounded-md border p-2 text-xs">
                                        <span className="font-medium">{String(a.action ?? '')}</span>
                                        <span className="text-muted-foreground ml-2">{String((a.user as { name?: string })?.name ?? '')}</span>
                                        {a.createdAt != null && <span className="text-muted-foreground ml-2">{formatDateTime(new Date(String(a.createdAt)))}</span>}
                                    </div>
                                ))}
                                {((caseData.auditTrail as unknown[]) ?? []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No audit entries</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {caseData && userRole !== 'PROCESSOR' && (
                    <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">Reassign</Button>
                        {['PROJECT_MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '') && (
                            <>
                                <Button variant="outline" size="sm">Hold</Button>
                                <Button variant="outline" size="sm">Release</Button>
                            </>
                        )}
                        <Button variant="outline" size="sm">Escalate</Button>
                        <Button variant="outline" size="sm">Add Note</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
