export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-16 rounded-md" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 7 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-[200px] w-full rounded-md" />
    </div>
  )
}
