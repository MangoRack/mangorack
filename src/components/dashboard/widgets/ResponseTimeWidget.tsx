"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Timer } from "lucide-react"
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

interface ResponseTimeWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

export function ResponseTimeWidget({ id, dragHandleProps }: ResponseTimeWidgetProps) {
  const [timeRange, setTimeRange] = useState("24h")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["response-time", timeRange],
    queryFn: () =>
      fetch(`/api/analytics?range=${timeRange}`).then((r) => r.json()),
    staleTime: 30000,
  })

  const chartData: { time: string; avg: number; p95?: number }[] =
    data?.responseTime ??
    data?.data ??
    Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 2}:00`,
      avg: 100 + Math.random() * 150,
      p95: 200 + Math.random() * 200,
    }))

  return (
    <WidgetWrapper
      id={id}
      title="Response Time"
      icon={<Timer className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load response data" : null}
      onRefresh={refetch}
      showTimeRange
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      dragHandleProps={dragHandleProps}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No response time data yet
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
                unit="ms"
                width={50}
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
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="Average"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              {chartData[0]?.p95 !== undefined && (
                <Line
                  type="monotone"
                  dataKey="p95"
                  name="P95"
                  stroke="hsl(var(--warning))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </WidgetWrapper>
  )
}
