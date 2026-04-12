import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
