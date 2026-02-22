import { Skeleton } from '@/components/ui/skeleton'

export default function CorrectionsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-40 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-80 w-full rounded-lg" />
                <Skeleton className="h-80 w-full rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    )
}
