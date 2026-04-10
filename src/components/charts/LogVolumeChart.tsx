"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const LEVEL_COLORS = {
  DEBUG: "#94a3b8",
  INFO: "#60a5fa",
  WARN: "#facc15",
  ERROR: "#f87171",
  FATAL: "#dc2626",
}

interface LogVolumeChartProps {
  data: Array<{
    time: string
    DEBUG: number
    INFO: number
    WARN: number
    ERROR: number
    FATAL: number
  }>
}

export function LogVolumeChart({ data }: LogVolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          stroke="hsl(var(--border))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
        />
        <Area
          type="monotone"
          dataKey="FATAL"
          stackId="1"
          stroke={LEVEL_COLORS.FATAL}
          fill={LEVEL_COLORS.FATAL}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="ERROR"
          stackId="1"
          stroke={LEVEL_COLORS.ERROR}
          fill={LEVEL_COLORS.ERROR}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="WARN"
          stackId="1"
          stroke={LEVEL_COLORS.WARN}
          fill={LEVEL_COLORS.WARN}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="INFO"
          stackId="1"
          stroke={LEVEL_COLORS.INFO}
          fill={LEVEL_COLORS.INFO}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="DEBUG"
          stackId="1"
          stroke={LEVEL_COLORS.DEBUG}
          fill={LEVEL_COLORS.DEBUG}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
