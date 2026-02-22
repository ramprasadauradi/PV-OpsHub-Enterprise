'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Kanban } from 'lucide-react'

const PipelineKanban = dynamic(() => import('@/components/pipeline/PipelineKanban'), { ssr: false })

export default function PipelinePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Kanban className="h-8 w-8" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pipeline View</h1>
                    <p className="text-muted-foreground">Drag cases to advance workflow stage</p>
                </div>
            </div>
            <PipelineKanban />
        </div>
    )
}
