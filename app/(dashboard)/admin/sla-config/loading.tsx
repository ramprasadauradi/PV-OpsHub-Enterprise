import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSLAConfigLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
    )
}
