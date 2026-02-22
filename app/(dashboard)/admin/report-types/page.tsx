'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { REPORT_TYPES } from '@/constants/report-types'
import { ClipboardList, Check, X, Settings } from 'lucide-react'

export default function ReportTypesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Report Types</h1>
                    <p className="text-muted-foreground">Manage which report types are active for this tenant</p>
                </div>
                <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" /> Save Changes
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="p-3 text-left font-medium">#</th>
                                <th className="p-3 text-left font-medium">Code</th>
                                <th className="p-3 text-left font-medium">Label</th>
                                <th className="p-3 text-center font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {REPORT_TYPES.map((rt, idx) => (
                                <tr key={rt.code} className="border-b hover:bg-muted/20 transition-colors">
                                    <td className="p-3 text-muted-foreground">{rt.sortOrder}</td>
                                    <td className="p-3 font-mono text-xs">{rt.code}</td>
                                    <td className="p-3 font-medium">{rt.label}</td>
                                    <td className="p-3 text-center">
                                        <Badge variant="success" className="text-xs">
                                            <Check className="h-3 w-3 mr-1" /> Active
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
