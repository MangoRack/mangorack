import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Form fields */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-3 w-64" />
        </div>
      ))}

      {/* Save button */}
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  )
}
