import { Skeleton } from '@/components/ui/skeleton'

export default function PipelineLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="min-w-[280px] space-y-3">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        {Array.from({ length: 4 }).map((_, j) => (
                            <Skeleton key={j} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
