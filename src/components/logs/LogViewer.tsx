"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, ScrollText } from "lucide-react"
import { useLicense } from "@/hooks/useLicense"
import { LogEntryRow } from "./LogEntry"
import { LogFilters, type LogFiltersState } from "./LogFilters"
import type { LogEntry } from "@/types/log"
import type { ApiResponse } from "@/types/api"

function LogRetentionNotice() {
  const { isPro } = useLicense()
  if (isPro) return null
  return (
    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border">
      Logs older than 3 days are automatically deleted.{" "}
      <a
        href="/settings/license"
        className="text-primary hover:underline font-medium"
      >
        Upgrade to Pro
      </a>{" "}
      for 90-day retention.
    </div>
  )
}

interface LogViewerProps {
  serviceId?: string
  maxHeight?: string
  showToolbar?: boolean
}

export function LogViewer({
  serviceId,
  maxHeight = "calc(100vh - 340px)",
  showToolbar = true,
}: LogViewerProps) {
  const [filters, setFilters] = useState<LogFiltersState>({
    levels: [],
    serviceId: serviceId || "",
    search: "",
    timeRange: null,
    from: "",
    to: "",
    live: false,
  })
  const [page, setPage] = useState(1)
  const limit = 100

  const buildUrl = useCallback(() => {
    const base = serviceId
      ? `/api/services/${serviceId}/logs`
      : "/api/logs"
    const params = new URLSearchParams()
    if (filters.levels.length === 1) params.set("level", filters.levels[0])
    if (!serviceId && filters.serviceId)
      params.set("serviceId", filters.serviceId)
    if (filters.search) params.set("search", filters.search)
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)
    params.set("limit", String(limit))
    params.set("page", String(page))
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }, [serviceId, filters, page])

  const { data, isLoading, error } = useQuery<ApiResponse<LogEntry[]>>({
    queryKey: ["logViewer", serviceId, filters, page],
    queryFn: async () => {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error("Failed to fetch logs")
      return res.json()
    },
    refetchInterval: filters.live ? 5000 : false,
  })

  const { data: servicesData } = useQuery<
    ApiResponse<Array<{ id: string; name: string }>>
  >({
    queryKey: ["servicesList"],
    queryFn: async () => {
      const res = await fetch("/api/services?limit=100")
      if (!res.ok) throw new Error("Failed to fetch services")
      return res.json()
    },
    enabled: !serviceId && showToolbar,
  })

  const logs: LogEntry[] = Array.isArray(data?.data) ? data.data : []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const services: Array<{ id: string; name: string }> = Array.isArray(servicesData?.data) ? servicesData.data : []

  // Build service name lookup
  const serviceNames: Record<string, string> = {}
  services.forEach((s) => {
    serviceNames[s.id] = s.name
  })

  // Client-side level filtering when multiple levels selected
  const filteredLogs =
    filters.levels.length > 1
      ? logs.filter((log: LogEntry) => filters.levels.includes(log.level))
      : logs

  const handleFiltersChange = useCallback((newFilters: LogFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {showToolbar && (
        <LogFilters
          filters={filters}
          onChange={handleFiltersChange}
          total={total}
          showing={filteredLogs.length}
          services={services}
        />
      )}

      {/* Log list */}
      <div
        className="rounded-lg border border-border bg-card overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-destructive">
              Failed to load logs. Please try again.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No logs found</p>
              <p className="text-xs mt-1">
                Try adjusting your filters or time range
              </p>
            </div>
          ) : (
            filteredLogs.map((log: LogEntry, i: number) => (
              <LogEntryRow
                key={log.id}
                log={log}
                serviceName={
                  log.serviceId ? serviceNames[log.serviceId] : undefined
                }
                isEven={i % 2 === 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>

        <LogRetentionNotice />
      </div>
    </div>
  )
}
