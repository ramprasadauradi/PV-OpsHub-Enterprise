'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCases } from '@/hooks/useCases'
import { useFilterStore } from '@/stores/filterStore'
import { formatDate, getSLAColor } from '@/lib/utils'
import { WORKFLOW_STAGES, getStatusMeta } from '@/constants/workflow-stages'
import CaseDrillDownModal from '@/components/cases/CaseDrillDownModal'
import type { APIResponse } from '@/types'
import { Search, Filter, ChevronLeft, ChevronRight, FileText, XCircle, Plus } from 'lucide-react'

export default function CasesPage() {
    const { data: session } = useSession()
    const { caseFilters, setCaseFilter, clearCaseFilters } = useFilterStore()
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

    // Support opening case from URL e.g. /cases?open=caseId
    useEffect(() => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        const openId = params.get('open')
        if (openId) setSelectedCaseId(openId)
    }, [])

    const { data, isLoading, error } = useCases({
        ...caseFilters,
        page,
        pageSize: 20,
        search: searchQuery || undefined,
    })

    const responseData = (data as APIResponse<unknown>)?.data as Array<Record<string, unknown>> ?? []
    const pagination = (data as APIResponse<unknown>)?.pagination

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold">Failed to load cases</h3>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Case Management</h1>
                    <p className="text-muted-foreground">View and manage all pharmacovigilance cases</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Case
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by case number, reference ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={String(caseFilters.currentStatus ?? '')} onValueChange={(v) => setCaseFilter('currentStatus', v || undefined)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UNALLOCATED">Unallocated</SelectItem>
                                <SelectItem value="ALLOCATED">Allocated</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={String(caseFilters.currentStage ?? '')} onValueChange={(v) => setCaseFilter('currentStage', v || undefined)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {WORKFLOW_STAGES.map((s) => (
                                    <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(caseFilters.seriousness ?? '')} onValueChange={(v) => setCaseFilter('seriousness', v || undefined)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Seriousness" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SERIOUS">Serious</SelectItem>
                                <SelectItem value="NON_SERIOUS">Non-Serious</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={clearCaseFilters}>
                            <Filter className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Case Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="p-3 text-left font-medium text-muted-foreground">Reference</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Case #</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Report Type</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Country</th>
                                        <th className="p-3 text-center font-medium text-muted-foreground">Stage</th>
                                        <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 text-center font-medium text-muted-foreground">SLA Risk</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Assigned To</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Deadline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responseData.map((c) => {
                                        const statusMeta = getStatusMeta(String(c.currentStatus ?? ''))
                                        const slaColor = getSLAColor(Number(c.slaRiskScore ?? 0))
                                        const activeAlloc = (c.allocations as Array<Record<string, unknown>> ?? [])[0]

                                        return (
                                            <tr
                                                key={String(c.id)}
                                                className="border-b hover:bg-muted/20 cursor-pointer transition-colors"
                                                onClick={() => setSelectedCaseId(String(c.id))}
                                            >
                                                <td className="p-3 font-medium">{String(c.referenceId ?? '')}</td>
                                                <td className="p-3 text-muted-foreground">{String(c.caseNumber ?? '')}</td>
                                                <td className="p-3">{String(c.reportType ?? '')}</td>
                                                <td className="p-3">{String(c.country ?? '')}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className="text-xs">{String(c.currentStage ?? '')}</Badge>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge
                                                        className="text-xs"
                                                        style={{ backgroundColor: statusMeta?.color ?? '#6b7280', color: 'white' }}
                                                    >
                                                        {statusMeta?.label ?? String(c.currentStatus ?? '')}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant={slaColor === 'green' ? 'success' : slaColor === 'red' ? 'destructive' : 'warning'} className="text-xs">
                                                        {String(Math.round(Number(c.slaRiskScore ?? 0)))}%
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    {activeAlloc
                                                        ? String((activeAlloc.assignedTo as Record<string, unknown>)?.name ?? '')
                                                        : <span className="text-muted-foreground italic">Unassigned</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {c.slaDeadline ? formatDate(new Date(String(c.slaDeadline))) : '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {responseData.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                <FileText className="mx-auto h-8 w-8 mb-2" />
                                                No cases found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * (pagination.pageSize ?? 20)) + 1}–{Math.min(page * (pagination.pageSize ?? 20), pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">Page {page}</span>
                        <Button variant="outline" size="sm" disabled={page * (pagination.pageSize ?? 20) >= pagination.total} onClick={() => setPage(page + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <CaseDrillDownModal
                caseId={selectedCaseId}
                open={!!selectedCaseId}
                onClose={() => setSelectedCaseId(null)}
                userRole={session?.user?.role ?? 'PROCESSOR'}
            />
        </div>
    )
}
