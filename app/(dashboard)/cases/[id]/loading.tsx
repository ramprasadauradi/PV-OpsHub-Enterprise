import { Skeleton } from '@/components/ui/skeleton'

export default function CaseDetailLoading() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}
