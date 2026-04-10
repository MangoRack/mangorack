"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, Server, AlertTriangle, Clock } from "lucide-react"
import { WidgetWrapper } from "../WidgetWrapper"

interface QuickStatsWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

export function QuickStatsWidget({ id, dragHandleProps }: QuickStatsWidgetProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["quick-stats"],
    queryFn: async () => {
      const [servicesRes, uptimeRes, alertsRes] = await Promise.allSettled([
        fetch("/api/services").then((r) => r.json()),
        fetch("/api/uptime").then((r) => r.json()),
        fetch("/api/alerts").then((r) => r.json()),
      ])
      const services = servicesRes.status === "fulfilled" ? servicesRes.value : null
      const uptime = uptimeRes.status === "fulfilled" ? uptimeRes.value : null
      const alerts = alertsRes.status === "fulfilled" ? alertsRes.value : null
      return { services, uptime, alerts }
    },
    staleTime: 30000,
  })

  const serviceCount = Array.isArray(data?.services) ? data.services.length : 0
  const uptimePercent = data?.uptime?.overall ?? data?.uptime?.percentage ?? null
  const alertCount = Array.isArray(data?.alerts) ? data.alerts.filter((a: { resolved?: boolean }) => !a.resolved).length : 0
  const avgResponse = data?.uptime?.avgResponseTime ?? null

  const stats = [
    {
      label: "Services",
      value: serviceCount,
      icon: <Server className="w-4 h-4" />,
      color: "text-blue-500",
    },
    {
      label: "Uptime",
      value: uptimePercent !== null ? `${Number(uptimePercent).toFixed(1)}%` : "--",
      icon: <Activity className="w-4 h-4" />,
      color: "text-green-500",
    },
    {
      label: "Active Alerts",
      value: alertCount,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: alertCount > 0 ? "text-red-500" : "text-green-500",
    },
    {
      label: "Avg Response",
      value: avgResponse !== null ? `${Math.round(avgResponse)}ms` : "--",
      icon: <Clock className="w-4 h-4" />,
      color: "text-yellow-500",
    },
  ]

  return (
    <WidgetWrapper
      id={id}
      title="Quick Stats"
      icon={<Activity className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load stats" : null}
      onRefresh={refetch}
      dragHandleProps={dragHandleProps}
    >
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 p-3 rounded-md bg-muted/50"
          >
            <div className={`flex items-center gap-1.5 ${stat.color}`}>
              {stat.icon}
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <span className="text-xl font-bold text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
