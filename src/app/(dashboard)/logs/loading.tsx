import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Log viewer skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <TableSkeleton rows={10} columns={5} />
      </div>
    </div>
  )
}
