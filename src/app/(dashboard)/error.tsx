"use client"

import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
