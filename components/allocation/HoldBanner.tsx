'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { PauseCircle, PlayCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export interface HoldInfo {
    id: string
    holdType: string
    heldAt: string
    autoReleaseAt?: string | null
    notes?: string | null
    case?: { referenceId?: string } | null
}

interface HoldBannerProps {
    heldCaseCount: number
    activeHolds: HoldInfo[]
    onRelease?: (holdId: string) => void
    canRelease?: boolean
}

export default function HoldBanner({
    heldCaseCount,
    activeHolds,
    onRelease,
    canRelease = true,
}: HoldBannerProps) {
    if (heldCaseCount === 0) return null

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
                <PauseCircle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                    <p className="font-semibold text-red-900 dark:text-red-100">Allocation Hold Active</p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                        {heldCaseCount} case{heldCaseCount !== 1 ? 's' : ''} on hold
                        {activeHolds[0]?.heldAt && (
                            <> · Since {formatDateTime(activeHolds[0].heldAt)}</>
                        )}
                        {activeHolds[0]?.autoReleaseAt && (
                            <> · Auto-release {formatDateTime(activeHolds[0].autoReleaseAt)}</>
                        )}
                    </p>
                </div>
            </div>
            {canRelease && activeHolds.length > 0 && onRelease && (
                <div className="flex flex-wrap gap-2">
                    {activeHolds.map((hold) => (
                        <Button
                            key={hold.id}
                            variant="outline"
                            size="sm"
                            onClick={() => onRelease(hold.id)}
                            className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/50"
                        >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Release{activeHolds.length > 1 ? ` (${hold.holdType})` : ''}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
}
