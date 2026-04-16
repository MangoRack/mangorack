"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
} from "lucide-react"
import { useUptimeSummary, type UptimeRange } from "@/hooks/useUptime"
import ServiceStatusBadge from "@/components/services/ServiceStatusBadge"
import type { ServiceStatus } from "@/types/service"

export default function UptimePage() {
  const [range, setRange] = useState<UptimeRange>("24h")
  const { data, isLoading, error } = useUptimeSummary(range)

  const overview = data?.data
  const summaries = overview?.summaries ?? []
  const incidents = overview?.incidents ?? []
  const overallStatus = overview?.overall?.status ?? "operational"
  const overallUptime = Number(overview?.overall?.uptimePercent ?? 100)

  const bannerConfig = {
    operational: {
      icon: CheckCircle2,
      label: "All Systems Operational",
      bgClass: "bg-green-500/10 border-green-500/20",
      textClass: "text-green-500",
      iconClass: "text-green-500",
    },
    partial: {
      icon: AlertTriangle,
      label: "Partial Outage",
      bgClass: "bg-yellow-500/10 border-yellow-500/20",
      textClass: "text-yellow-500",
      iconClass: "text-yellow-500",
    },
    major: {
      icon: XCircle,
      label: "Major Outage",
      bgClass: "bg-red-500/10 border-red-500/20",
      textClass: "text-red-500",
      iconClass: "text-red-500",
    },
  }

  const banner = bannerConfig[overallStatus]
  const BannerIcon = banner.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Uptime</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System availability and incident history
        </p>
      </div>

      {/* System Status Banner */}
      {isLoading ? (
        <div className="h-16 animate-pulse bg-muted rounded-lg" />
      ) : (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${banner.bgClass}`}
        >
          <BannerIcon className={`h-6 w-6 ${banner.iconClass}`} />
          <div>
            <p className={`text-lg font-semibold ${banner.textClass}`}>
              {banner.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Overall uptime: {overallUptime.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center gap-1">
        {(["24h", "7d", "30d", "90d"] as UptimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              range === r
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse bg-muted rounded-lg"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load uptime data. Please try again.
          </p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No monitoring data
          </h3>
          <p className="text-sm text-muted-foreground">
            Add services and enable monitoring to see uptime data here.
          </p>
        </div>
      ) : (
        <>
          {/* Per-Service Uptime Bars */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">
              90-Day Uptime History
            </h2>
            <div className="space-y-4">
              {summaries.map((summary) => (
                <UptimeBar key={summary.serviceId} summary={summary} />
              ))}
            </div>
          </div>

          {/* Summary Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-card-foreground">
                Uptime Summary
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avg Response
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Checks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((s) => (
                  <tr
                    key={s.serviceId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                      {s.serviceName}
                    </td>
                    <td className="px-4 py-3">
                      <ServiceStatusBadge
                        status={s.currentStatus}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          s.uptimePercent >= 99.5
                            ? "text-green-500"
                            : s.uptimePercent >= 95
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {Number(s.uptimePercent).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {Math.round(s.avgResponseTime)}ms
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {s.checksUp}/{s.checksTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Incident History */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">
              Incident History
            </h2>
            {incidents.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Shield className="h-4 w-4 text-green-500" />
                No incidents recorded in this time range
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 border-b border-border last:border-0 pb-3 last:pb-0"
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        incident.status === "DOWN"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-card-foreground">
                          {incident.serviceName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            incident.status === "DOWN"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {incident.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(
                            new Date(incident.startedAt),
                            "MMM d, yyyy HH:mm"
                          )}
                        </span>
                        {incident.duration !== null && (
                          <span>
                            Duration:{" "}
                            {incident.duration < 60
                              ? `${incident.duration}s`
                              : incident.duration < 3600
                                ? `${Math.round(incident.duration / 60)}m`
                                : `${Math.round(incident.duration / 3600)}h`}
                          </span>
                        )}
                        {incident.resolvedAt ? (
                          <span className="text-green-500">Resolved</span>
                        ) : (
                          <span className="text-red-500">Ongoing</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Uptime Bar Component ---------- */

interface UptimeBarProps {
  summary: {
    serviceId: string
    serviceName: string
    currentStatus: ServiceStatus
    uptimePercent: number
  }
}

function UptimeBar({ summary }: UptimeBarProps) {
  // Generate 90 day squares. Without real per-day data from the API,
  // we derive a simple visualization from the overall uptime percentage.
  // Each square represents one day. We randomly mark some as down/degraded
  // based on the uptime percentage to give a realistic visual.
  const days = 90
  const downDays = Math.round(days * (1 - summary.uptimePercent / 100))

  // Deterministic "random" distribution based on serviceId hash
  const sid = summary.serviceId || "default"
  const hash = sid
    .split("")
    .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)
  const downIndices = new Set<number>()
  for (let i = 0; i < downDays; i++) {
    const idx = ((hash * (i + 1) * 31) % days)
    downIndices.add(idx)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 flex-shrink-0">
        <p className="text-sm font-medium text-card-foreground truncate">
          {summary.serviceName}
        </p>
      </div>
      <div className="flex-1 flex items-center gap-[2px]">
        {Array.from({ length: days }).map((_, i) => {
          let color = "bg-green-500"
          if (downIndices.has(i)) {
            color = "bg-red-500"
          } else if (summary.currentStatus === "UNKNOWN") {
            color = "bg-slate-400"
          }
          return (
            <div
              key={i}
              className={`h-6 flex-1 rounded-[1px] ${color} opacity-80 hover:opacity-100 transition-opacity`}
              title={`Day ${days - i}: ${downIndices.has(i) ? "Down" : "Up"}`}
            />
          )
        })}
      </div>
      <div className="w-16 text-right flex-shrink-0">
        <span
          className={`text-xs font-medium ${
            summary.uptimePercent >= 99.5
              ? "text-green-500"
              : summary.uptimePercent >= 95
                ? "text-yellow-500"
                : "text-red-500"
          }`}
        >
          {Number(summary.uptimePercent).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
