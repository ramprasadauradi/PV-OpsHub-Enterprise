'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SLA_REGIONAL_DEFAULTS, SLA_RISK_THRESHOLDS } from '@/constants/sla-defaults'
import { Scale, Plus, Settings } from 'lucide-react'

export default function SLARulesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">SLA Rules</h1>
                    <p className="text-muted-foreground">Configure SLA submission deadlines by region</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Rule
                </Button>
            </div>

            {/* Default SLA Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Scale className="h-5 w-5" /> Regional Defaults
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-3 text-left font-medium">Country</th>
                                    <th className="p-3 text-center font-medium">Serious (days)</th>
                                    <th className="p-3 text-center font-medium">Non-Serious (days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SLA_REGIONAL_DEFAULTS.map((sla) => (
                                    <tr key={sla.country} className="border-b hover:bg-muted/20">
                                        <td className="p-3 font-medium">{sla.country}</td>
                                        <td className="p-3 text-center font-mono">{sla.seriousDays}</td>
                                        <td className="p-3 text-center font-mono">{sla.nonSeriousDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Thresholds */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5" /> Risk Score Thresholds
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        {Object.values(SLA_RISK_THRESHOLDS).map((t) => (
                            <div key={t.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${t.color}15` }}>
                                <div className="h-3 w-3 rounded-full mx-auto mb-2" style={{ backgroundColor: t.color }} />
                                <p className="font-semibold" style={{ color: t.color }}>{t.label}</p>
                                <p className="text-sm text-muted-foreground mt-1">≤ {t.max}%</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
