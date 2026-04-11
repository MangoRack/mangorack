"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { WidgetWrapper } from "../WidgetWrapper"
import { useLicenseStore } from "@/stores/licenseStore"

interface MetricsChartWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

export function MetricsChartWidget({ id, dragHandleProps }: MetricsChartWidgetProps) {
  const [timeRange, setTimeRange] = useState("24h")
  const plan = useLicenseStore((s) => s.plan)
  const isLocked = plan === "FREE"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["metrics-chart", timeRange],
    queryFn: () =>
      fetch(`/api/analytics?range=${timeRange}`).then((r) => r.json()),
    staleTime: 30000,
    enabled: !isLocked,
  })

  const chartData: { time: string; cpu: number; memory: number }[] =
    data?.metrics ??
    data?.data ??
    []

  return (
    <WidgetWrapper
      id={id}
      title="Metrics Chart"
      icon={<BarChart3 className="w-4 h-4" />}
      isLoading={!isLocked && isLoading}
      error={!isLocked && error ? "Failed to load metrics" : null}
      onRefresh={refetch}
      isPro={isLocked}
      showTimeRange
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      dragHandleProps={dragHandleProps}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No metrics data yet
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                name="Memory"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </WidgetWrapper>
  )
}
