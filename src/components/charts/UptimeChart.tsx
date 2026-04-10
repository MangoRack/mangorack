"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface UptimeDataPoint {
  hour: string
  up: number
  down: number
  degraded: number
}

interface UptimeChartProps {
  data: UptimeDataPoint[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-medium text-card-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-muted-foreground">
          <span
            className={
              entry.dataKey === "up"
                ? "text-green-500"
                : entry.dataKey === "down"
                  ? "text-red-500"
                  : "text-yellow-500"
            }
          >
            {entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}
          </span>
          : {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function UptimeChart({ data }: UptimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No uptime data available
      </div>
    )
  }

  // Create stacked data where each bar shows the total checks
  // colored by status
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="up" stackId="status" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar
          dataKey="degraded"
          stackId="status"
          fill="#eab308"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="down"
          stackId="status"
          fill="#ef4444"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
