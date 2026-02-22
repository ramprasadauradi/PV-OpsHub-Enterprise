'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

export default function AuditPage() {
    const [page, setPage] = useState(1)
    const [actionFilter, setActionFilter] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['audit', page, actionFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), pageSize: '25' })
            if (actionFilter) params.set('action', actionFilter)
            const res = await fetch(`/api/audit?${params}`)
            return res.json()
        },
    })

    const auditLogs = ((data as Record<string, unknown>)?.data ?? []) as Array<Record<string, unknown>>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
                    <p className="text-muted-foreground">Immutable log of all system actions (21 CFR Part 11)</p>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by user, entity, or action..." className="pl-10" />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CASE_CREATED">Case Created</SelectItem>
                            <SelectItem value="CASE_ALLOCATED">Case Allocated</SelectItem>
                            <SelectItem value="CASE_STAGE_ADVANCED">Stage Advanced</SelectItem>
                            <SelectItem value="CORRECTION_LOGGED">Correction Logged</SelectItem>
                            <SelectItem value="HOLD_INITIATED">Hold Initiated</SelectItem>
                            <SelectItem value="HOLD_RELEASED">Hold Released</SelectItem>
                            <SelectItem value="CAPA_TRIGGERED">CAPA Triggered</SelectItem>
                            <SelectItem value="USER_LOGIN">User Login</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="p-3 text-left font-medium">Timestamp</th>
                                <th className="p-3 text-left font-medium">User</th>
                                <th className="p-3 text-left font-medium">Action</th>
                                <th className="p-3 text-left font-medium">Entity</th>
                                <th className="p-3 text-left font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.map((log) => (
                                <tr key={String(log.id)} className="border-b hover:bg-muted/20">
                                    <td className="p-3 text-xs font-mono text-muted-foreground">
                                        {log.createdAt ? formatDate(new Date(String(log.createdAt))) : ''}
                                    </td>
                                    <td className="p-3">{String((log.user as Record<string, unknown>)?.name ?? log.userId)}</td>
                                    <td className="p-3">
                                        <Badge variant="outline" className="text-xs">{String(log.action)}</Badge>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{String(log.entityType)} · <span className="font-mono text-xs">{String(log.entityId).slice(0, 8)}</span></td>
                                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                        {JSON.stringify(log.after ?? log.metadata ?? {})}
                                    </td>
                                </tr>
                            ))}
                            {auditLogs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <BookOpen className="mx-auto h-8 w-8 mb-2" />
                                        No audit entries found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Compliance badge */}
            <div className="text-center">
                <Badge variant="outline" className="text-xs px-4 py-1">
                    <BookOpen className="h-3 w-3 mr-1.5" />
                    21 CFR Part 11 Compliant — Records are immutable and tamper-evident
                </Badge>
            </div>
        </div>
    )
}
