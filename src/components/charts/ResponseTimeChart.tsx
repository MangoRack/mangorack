"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"

interface ResponseTimeDataPoint {
  time: string
  responseTime: number
}

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-medium text-card-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Response:{" "}
        <span className="text-blue-500 font-medium">
          {payload[0].value}ms
        </span>
      </p>
    </div>
  )
}

export default function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No response time data available
      </div>
    )
  }

  const avg =
    data.reduce((sum, d) => sum + d.responseTime, 0) / data.length

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
      >
        <defs>
          <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          unit="ms"
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={Math.round(avg)}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="3 3"
          label={{
            value: `Avg: ${Math.round(avg)}ms`,
            position: "insideTopRight",
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="responseTime"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#responseGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
