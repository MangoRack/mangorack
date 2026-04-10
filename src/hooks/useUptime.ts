"use client"

import { useQuery } from "@tanstack/react-query"
import type { UptimeSummary, UptimeCheck } from "@/types/service"
import type { ApiResponse } from "@/types/api"

export type UptimeRange = "24h" | "7d" | "30d" | "90d"

interface UptimeOverview {
  summaries: UptimeSummary[]
  incidents: {
    serviceId: string
    serviceName: string
    status: string
    startedAt: string
    resolvedAt: string | null
    duration: number | null
  }[]
  overall: {
    status: "operational" | "partial" | "major"
    uptimePercent: number
  }
}

interface ServiceUptimeDetail {
  summary: UptimeSummary
  checks: UptimeCheck[]
  hourlyData: {
    hour: string
    up: number
    down: number
    degraded: number
    avgResponseTime: number
  }[]
  incidents: {
    id: string
    status: string
    startedAt: string
    resolvedAt: string | null
    duration: number | null
    error: string | null
  }[]
}

async function fetchUptimeSummary(
  range?: UptimeRange
): Promise<ApiResponse<UptimeOverview>> {
  const params = range ? `?range=${range}` : ""
  const res = await fetch(`/api/uptime${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to fetch uptime summary")
  }
  return res.json()
}

async function fetchServiceUptime(
  id: string,
  range?: UptimeRange
): Promise<ApiResponse<ServiceUptimeDetail>> {
  const params = range ? `?range=${range}` : ""
  const res = await fetch(`/api/uptime/${id}${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to fetch service uptime")
  }
  return res.json()
}

export function useUptimeSummary(range?: UptimeRange) {
  return useQuery({
    queryKey: ["uptime", "summary", range],
    queryFn: () => fetchUptimeSummary(range),
    refetchInterval: 60_000,
  })
}

export function useServiceUptime(id: string, range?: UptimeRange) {
  return useQuery({
    queryKey: ["uptime", id, range],
    queryFn: () => fetchServiceUptime(id, range),
    enabled: !!id,
    refetchInterval: 60_000,
  })
}
