"use client"

import { useQuery } from "@tanstack/react-query"

export interface AnalyticsData {
  summary: {
    uptimePercent: number
    uptimeTrend: number
    totalChecks: number
    avgResponseTime: number
    totalLogs: number
    errorRate: number
    errorRateTrend: number
    activeAlerts: number
  }
  uptimeTrend: Array<{ time: string; uptime: number }>
  responseTimeDistribution: Array<{
    service: string
    p50: number
    p95: number
    p99: number
  }>
  logVolume: Array<{
    time: string
    DEBUG: number
    INFO: number
    WARN: number
    ERROR: number
    FATAL: number
  }>
  errorRateOverTime: Array<{ time: string; rate: number }>
  slowestServices: Array<{ service: string; avgResponseTime: number }>
  mostErrors: Array<{ service: string; errorCount: number }>
  uptimeHeatmap: Array<{ day: number; hour: number; value: number }>
  responseTimeHeatmap: Array<{ day: number; hour: number; value: number }>
}

async function fetchAnalytics(range: string): Promise<AnalyticsData> {
  const res = await fetch(`/api/analytics?range=${range}`)
  if (!res.ok) throw new Error("Failed to fetch analytics")
  const json = await res.json()
  return json.data || json
}

export function useAnalytics(range: string = "24h") {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => fetchAnalytics(range),
    refetchInterval: 30000,
  })
}
