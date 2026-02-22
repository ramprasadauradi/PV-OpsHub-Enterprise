'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle } from 'lucide-react'

interface ExportOption {
    format: string
    icon: typeof FileSpreadsheet
    desc: string
    color: string
    endpoint: string
    filename: string
}

const EXPORT_OPTIONS: ExportOption[] = [
    {
        format: 'Case Data (CSV)',
        icon: FileSpreadsheet,
        desc: 'Export all case data with SLA, status, assignments',
        color: '#217346',
        endpoint: '/api/reports/export?format=csv',
        filename: 'pvopshub_cases.csv',
    },
    {
        format: 'Audit Trail (CSV)',
        icon: FileText,
        desc: 'Export the full immutable audit log (21 CFR Part 11)',
        color: '#DC2626',
        endpoint: '/api/reports/export?format=audit-csv',
        filename: 'pvopshub_audit.csv',
    },
]

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null)
    const [downloaded, setDownloaded] = useState<Set<string>>(new Set())

    const handleDownload = async (opt: ExportOption) => {
        setDownloading(opt.format)
        try {
            const res = await fetch(opt.endpoint)
            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = opt.filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setDownloaded((prev) => new Set(prev).add(opt.format))
            setTimeout(() => {
                setDownloaded((prev) => {
                    const next = new Set(prev)
                    next.delete(opt.format)
                    return next
                })
            }, 3000)
        } catch (error) {
            console.error('Download failed:', error)
        } finally {
            setDownloading(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Reports & Export</h1>
                <p className="text-muted-foreground">Generate and download operational reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {EXPORT_OPTIONS.map((opt) => {
                    const isDownloading = downloading === opt.format
                    const isDownloaded = downloaded.has(opt.format)
                    return (
                        <Card key={opt.format} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${opt.color}15` }}>
                                    <opt.icon className="h-8 w-8" style={{ color: opt.color }} />
                                </div>
                                <h3 className="font-semibold text-lg">{opt.format}</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">{opt.desc}</p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleDownload(opt)}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                                    ) : isDownloaded ? (
                                        <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Downloaded!</>
                                    ) : (
                                        <><Download className="h-4 w-4 mr-2" /> Download</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="text-center">
                <Badge variant="outline" className="text-xs px-4 py-1">
                    All exports are tenant-isolated and include only your organization's data
                </Badge>
            </div>
        </div>
    )
}
