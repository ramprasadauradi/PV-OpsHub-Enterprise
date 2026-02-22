import { Skeleton } from '@/components/ui/skeleton'

export default function AdminWorkflowLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-44 shrink-0 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    )
}
