"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowUpCircle } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { WidgetWrapper } from "../WidgetWrapper"

interface UptimeWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

export function UptimeWidget({ id, dragHandleProps }: UptimeWidgetProps) {
  const router = useRouter()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["uptime-summary"],
    queryFn: () => fetch("/api/uptime").then((r) => r.json()),
    staleTime: 30000,
  })

  const inner = (data as any)?.data ?? data
  const overallData = inner?.overall ?? {}
  const overall = overallData?.uptimePercent ?? inner?.percentage ?? 99.95
  const history: { value: number }[] = inner?.history ??
    Array.from({ length: 24 }, (_, i) => ({
      value: 99 + Math.random(),
    }))

  const summaries: any[] = inner?.summaries ?? inner?.services ?? []
  const upCount = summaries.filter((s: any) => (s.currentStatus || s.status || "").toUpperCase() === "UP").length
  const downCount = summaries.filter((s: any) => (s.currentStatus || s.status || "").toUpperCase() === "DOWN").length
  const degradedCount = summaries.filter((s: any) => (s.currentStatus || s.status || "").toUpperCase() === "DEGRADED").length

  const uptimeColor =
    overall >= 99.9
      ? "text-green-500"
      : overall >= 99
        ? "text-yellow-500"
        : "text-red-500"

  return (
    <WidgetWrapper
      id={id}
      title="Uptime Summary"
      icon={<ArrowUpCircle className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load uptime data" : null}
      onRefresh={refetch}
      dragHandleProps={dragHandleProps}
    >
      <div
        className="cursor-pointer space-y-3"
        onClick={() => router.push("/uptime")}
      >
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Uptime</p>
            <p className={`text-4xl font-bold tabular-nums ${uptimeColor}`}>
              {Number(overall).toFixed(2)}%
            </p>
          </div>
          <div className="flex-1 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {upCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {upCount} Up
            </span>
          )}
          {downCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {downCount} Down
            </span>
          )}
          {degradedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              {degradedCount} Degraded
            </span>
          )}
          {upCount === 0 && downCount === 0 && degradedCount === 0 && (
            <span className="text-xs text-muted-foreground">No services tracked yet</span>
          )}
        </div>
      </div>
    </WidgetWrapper>
  )
}
