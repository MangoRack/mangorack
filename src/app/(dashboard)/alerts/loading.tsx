import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-12 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Free tier notice */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Recent events */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="rounded-lg border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
            >
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
