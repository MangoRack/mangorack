"use client"

import { Fragment, useState } from "react"
import {
  BarChart as BarChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  ScrollText,
  AlertTriangle,
  Bell,
  CheckCircle,
  Lock,
  Loader2,
  TrendingUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useAnalytics, type AnalyticsData } from "@/hooks/useAnalytics"
import { MetricsLineChart } from "@/components/charts/MetricsLineChart"
import { LogVolumeChart } from "@/components/charts/LogVolumeChart"

const RANGES = [
  { label: "24h", value: "24h", pro: false },
  { label: "7d", value: "7d", pro: false },
  { label: "30d", value: "30d", pro: true },
  { label: "90d", value: "90d", pro: true },
]

function ProOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
      <div className="flex flex-col items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Pro Feature</p>
        <a
          href="/settings/license"
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
  isPro = false,
}: {
  title: string
  children: React.ReactNode
  isPro?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 relative">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {isPro && <ProOverlay />}
      <div className={isPro ? "blur-sm opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  trend?: number
  iconColor?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${iconColor || "text-muted-foreground"}`} />
        {trend !== undefined && (
          <span
            className={`flex items-center text-xs font-medium ${
              trend >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">
        {value}
        {unit && (
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function HeatmapGrid({
  data,
  colorScale,
}: {
  data: Array<{ day: number; hour: number; value: number }>
  colorScale: (value: number) => string
}) {
  const grid: number[][] = Array.from({ length: 24 }, () =>
    Array(7).fill(0)
  )
  data.forEach((d) => {
    if (d.hour >= 0 && d.hour < 24 && d.day >= 0 && d.day < 7) {
      grid[d.hour][d.day] = d.value
    }
  })

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(7, 1fr)` }}>
        {/* Header */}
        <div />
        {dayLabels.map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground text-center px-1">
            {d}
          </div>
        ))}
        {/* Rows */}
        {grid.map((row, hour) => (
          <Fragment key={`row-${hour}`}>
            <div className="text-[10px] text-muted-foreground text-right pr-2 leading-[18px]">
              {String(hour).padStart(2, "0")}:00
            </div>
            {row.map((val, day) => (
              <div
                key={`${hour}-${day}`}
                className="w-[18px] h-[18px] rounded-sm"
                style={{ backgroundColor: colorScale(val) }}
                title={`${dayLabels[day]} ${String(hour).padStart(2, "0")}:00 - ${val}`}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// Placeholder data for empty/loading states
const emptyAnalytics: AnalyticsData = {
  summary: {
    uptimePercent: 0,
    uptimeTrend: 0,
    totalChecks: 0,
    avgResponseTime: 0,
    totalLogs: 0,
    errorRate: 0,
    errorRateTrend: 0,
    activeAlerts: 0,
  },
  uptimeTrend: [],
  responseTimeDistribution: [],
  logVolume: [],
  errorRateOverTime: [],
  slowestServices: [],
  mostErrors: [],
  uptimeHeatmap: [],
  responseTimeHeatmap: [],
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("24h")
  const { data: analytics, isLoading } = useAnalytics(range)
  const d = analytics || emptyAnalytics

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChartIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Performance metrics and insights
            </p>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {RANGES.map(({ label, value, pro }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors border-r border-border last:border-r-0 flex items-center gap-1 ${
                range === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {label}
              {pro && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/20 text-primary font-bold leading-none">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard
              icon={CheckCircle}
              label="Overall Uptime"
              value={`${d.summary.uptimePercent.toFixed(2)}%`}
              trend={d.summary.uptimeTrend}
              iconColor="text-green-500"
            />
            <SummaryCard
              icon={Activity}
              label="Total Checks Run"
              value={d.summary.totalChecks.toLocaleString()}
              iconColor="text-blue-400"
            />
            <SummaryCard
              icon={Clock}
              label="Avg Response Time"
              value={d.summary.avgResponseTime.toFixed(0)}
              unit="ms"
              iconColor="text-purple-400"
            />
            <SummaryCard
              icon={ScrollText}
              label="Total Logs Ingested"
              value={d.summary.totalLogs.toLocaleString()}
              iconColor="text-slate-400"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Error Rate"
              value={`${d.summary.errorRate.toFixed(2)}%`}
              trend={d.summary.errorRateTrend}
              iconColor="text-red-400"
            />
            <SummaryCard
              icon={Bell}
              label="Active Alerts"
              value={d.summary.activeAlerts}
              iconColor="text-yellow-400"
            />
          </div>

          {/* Charts - Free tier (2x2 grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Uptime Trend">
              <MetricsLineChart
                data={d.uptimeTrend as Array<Record<string, unknown>>}
                dataKey="uptime"
                color="#22c55e"
                unit="%"
              />
            </ChartCard>

            <ChartCard title="Response Time Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={d.responseTimeDistribution}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="service"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    stroke="hsl(var(--border))"
                    unit="ms"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="p50" fill="#60a5fa" name="P50" />
                  <Bar dataKey="p95" fill="#f59e0b" name="P95" />
                  <Bar dataKey="p99" fill="#ef4444" name="P99" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Log Volume">
              <LogVolumeChart data={d.logVolume} />
            </ChartCard>

            <ChartCard title="Error Rate Over Time">
              <MetricsLineChart
                data={d.errorRateOverTime as Array<Record<string, unknown>>}
                dataKey="rate"
                color="#f87171"
                unit="%"
              />
            </ChartCard>
          </div>

          {/* Charts - Pro tier (2x2 grid, blurred) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Top 5 Slowest Services" isPro>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={d.slowestServices}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    unit="ms"
                  />
                  <YAxis
                    type="category"
                    dataKey="service"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="avgResponseTime"
                    fill="#a78bfa"
                    name="Avg Response Time"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top 5 Most Errors" isPro>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={d.mostErrors}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="service"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="errorCount"
                    fill="#f87171"
                    name="Error Count"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Uptime Heatmap" isPro>
              <HeatmapGrid
                data={d.uptimeHeatmap}
                colorScale={(v) => {
                  if (v >= 99.9) return "#22c55e"
                  if (v >= 99) return "#86efac"
                  if (v >= 95) return "#fbbf24"
                  if (v >= 90) return "#f97316"
                  return "#ef4444"
                }}
              />
            </ChartCard>

            <ChartCard title="Response Time Heatmap" isPro>
              <HeatmapGrid
                data={d.responseTimeHeatmap}
                colorScale={(v) => {
                  if (v <= 100) return "#22c55e"
                  if (v <= 300) return "#86efac"
                  if (v <= 500) return "#fbbf24"
                  if (v <= 1000) return "#f97316"
                  return "#ef4444"
                }}
              />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
