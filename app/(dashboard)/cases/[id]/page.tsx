'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import CaseDrillDownModal from '@/components/cases/CaseDrillDownModal'
import { ArrowLeft } from 'lucide-react'

export default function CaseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const id = typeof params?.id === 'string' ? params.id : null

    const onClose = useCallback(() => {
        router.push('/cases')
    }, [router])

    useEffect(() => {
        if (!id) return
        // Optional: preload case data
    }, [id])

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <p className="text-muted-foreground">Case ID missing.</p>
                <Button variant="outline" onClick={() => router.push('/cases')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cases
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cases
                </Button>
            </div>
            <CaseDrillDownModal
                caseId={id}
                open={true}
                onClose={onClose}
                userRole={session?.user?.role ?? 'PROCESSOR'}
            />
        </>
    )
}
