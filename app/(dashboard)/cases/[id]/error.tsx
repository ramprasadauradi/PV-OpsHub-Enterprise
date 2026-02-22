'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function CaseDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Case detail error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
                We couldn’t load this case. Please try again.
            </p>
            <Button onClick={reset}>Try again</Button>
        </div>
    )
}
