"use client"

import { useQuery } from "@tanstack/react-query"
import type { LogEntry, LogFilter } from "@/types/log"
import type { ApiResponse } from "@/types/api"

interface UseLogsOptions extends LogFilter {
  live?: boolean
}

interface LogsResult {
  logs: LogEntry[]
  total: number
  page: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

function buildQueryString(filters?: LogFilter): string {
  if (!filters) return ""
  const params = new URLSearchParams()
  if (filters.level) params.set("level", filters.level)
  if (filters.serviceId) params.set("serviceId", filters.serviceId)
  if (filters.search) params.set("search", filters.search)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.limit) params.set("limit", String(filters.limit))
  if (filters.page) params.set("page", String(filters.page))
  if (filters.cursor) params.set("cursor", filters.cursor)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

async function fetchLogs(url: string): Promise<ApiResponse<LogEntry[]>> {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch logs")
  return res.json()
}

export function useLogs(options?: UseLogsOptions): LogsResult {
  const { live, ...filters } = options || {}
  const qs = buildQueryString(filters)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", filters],
    queryFn: () => fetchLogs(`/api/logs${qs}`),
    refetchInterval: live ? 5000 : false,
  })

  return {
    logs: data?.data || [],
    total: data?.meta?.total || 0,
    page: data?.meta?.page || 1,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}

export function useServiceLogs(
  serviceId: string,
  options?: UseLogsOptions
): LogsResult {
  const { live, ...filters } = options || {}
  const qs = buildQueryString(filters)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["serviceLogs", serviceId, filters],
    queryFn: () => fetchLogs(`/api/services/${serviceId}/logs${qs}`),
    refetchInterval: live ? 5000 : false,
    enabled: !!serviceId,
  })

  return {
    logs: data?.data || [],
    total: data?.meta?.total || 0,
    page: data?.meta?.page || 1,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
