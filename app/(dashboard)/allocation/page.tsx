'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useHoldStatus, useInitiateHold, useReleaseHold } from '@/hooks/useAllocation'
import HoldBanner from '@/components/allocation/HoldBanner'
import AllocationPanel from '@/components/allocation/AllocationPanel'
import { PauseCircle } from 'lucide-react'

export default function AllocationPage() {
    const { data: holdData } = useHoldStatus()
    const holdMutation = useInitiateHold()
    const releaseMutation = useReleaseHold()

    const holdInfo = (holdData as unknown as { data?: Record<string, unknown> })?.data
    const activeHolds = (holdInfo?.activeHolds as Array<{ id: string; holdType: string; heldAt: string; autoReleaseAt?: string | null; case?: { referenceId?: string } }>) ?? []
    const heldCount = Number(holdInfo?.heldCaseCount ?? 0)

    const handleHold = async () => {
        await holdMutation.mutateAsync({ holdType: 'ALL', notes: 'PM initiated hold' })
    }

    const handleRelease = (holdId: string) => {
        releaseMutation.mutate(holdId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Allocation</h1>
                    <p className="text-muted-foreground">Allocate cases to processors with governance enforcement</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleHold} disabled={holdMutation.isPending}>
                    <PauseCircle className="h-4 w-4 mr-1" /> Hold All
                </Button>
            </div>

            <HoldBanner
                heldCaseCount={heldCount}
                activeHolds={activeHolds}
                onRelease={handleRelease}
                canRelease={true}
            />

            <AllocationPanel caseFilter={{ currentStatus: 'UNALLOCATED' }} showSelectAll />
        </div>
    )
}
