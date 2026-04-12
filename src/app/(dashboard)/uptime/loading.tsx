import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Service status rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
