"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Bell, Info, AlertTriangle, AlertOctagon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { WidgetWrapper } from "../WidgetWrapper"

interface Alert {
  id: string
  severity: string
  message: string
  serviceName?: string
  service?: { name: string }
  resolved?: boolean
  createdAt: string
  timestamp?: string
}

interface AlertsWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

function getSeverityIcon(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
    case "fatal":
      return <AlertOctagon className="w-4 h-4 text-red-500" />
    case "warning":
    case "warn":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    default:
      return <Info className="w-4 h-4 text-blue-500" />
  }
}

function getSeverityBorder(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
    case "fatal":
      return "border-l-red-500"
    case "warning":
    case "warn":
      return "border-l-yellow-500"
    default:
      return "border-l-blue-500"
  }
}

export function AlertsWidget({ id, dragHandleProps }: AlertsWidgetProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["alerts-feed"],
    queryFn: () => fetch("/api/alerts").then((r) => r.json()),
    staleTime: 30000,
  })

  const alerts: Alert[] = (Array.isArray(data) ? data : data?.alerts ?? []).slice(0, 10)

  return (
    <WidgetWrapper
      id={id}
      title="Alerts Feed"
      icon={<Bell className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load alerts" : null}
      onRefresh={refetch}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No recent alerts
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {alerts.map((alert) => {
              const ts = alert.createdAt ?? alert.timestamp
              const timeAgo = ts
                ? formatDistanceToNow(new Date(ts), { addSuffix: true })
                : ""
              const svcName = alert.serviceName ?? alert.service?.name ?? "Unknown"
              const unresolved = !alert.resolved

              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-2.5 p-2 rounded-md border-l-2 ${
                    unresolved
                      ? getSeverityBorder(alert.severity)
                      : "border-l-transparent"
                  } ${unresolved ? "bg-muted/50" : ""}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {svcName}
                      </span>
                      {unresolved && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.message}
                    </p>
                    {timeAgo && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-1 border-t border-border">
          <Link href="/alerts" className="text-xs text-primary hover:underline">
            View all alerts
          </Link>
        </div>
      </div>
    </WidgetWrapper>
  )
}
