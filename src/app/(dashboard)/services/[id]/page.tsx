"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Trash2,
  Pause,
  Play,
  AlertTriangle,
  Clock,
  Activity,
  Shield,
  Settings,
  FileText,
  Bell,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  useService,
  useUpdateService,
  useDeleteService,
} from "@/hooks/useServices"
import { useServiceUptime, type UptimeRange } from "@/hooks/useUptime"
import ServiceStatusBadge from "@/components/services/ServiceStatusBadge"
import ServiceForm from "@/components/services/ServiceForm"
import type { ServiceFormValues } from "@/components/services/ServiceForm"
import UptimeChart from "@/components/charts/UptimeChart"
import ResponseTimeChart from "@/components/charts/ResponseTimeChart"

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "logs", label: "Logs", icon: FileText },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function ServiceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string

  const initialTab = (searchParams.get("tab") as TabKey) ?? "overview"
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uptimeRange, setUptimeRange] = useState<UptimeRange>("24h")

  const { data: serviceData, isLoading, error } = useService(id)
  const service = serviceData?.data
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const { data: uptimeData } = useServiceUptime(id, uptimeRange)
  const uptimeDetail = uptimeData?.data

  function handleTogglePause() {
    if (!service) return
    updateService.mutate(
      { id: service.id, pingEnabled: !service.pingEnabled },
      {
        onSuccess: () => {
          toast.success(
            service.pingEnabled ? "Monitoring paused" : "Monitoring resumed"
          )
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  function handleDelete() {
    deleteService.mutate(id, {
      onSuccess: () => {
        toast.success("Service deleted")
        router.push("/services")
      },
      onError: (err) => toast.error(err.message),
    })
  }

  function handleSettingsSave(data: ServiceFormValues) {
    updateService.mutate(
      { id, ...data },
      {
        onSuccess: () => toast.success("Service updated"),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md animate-pulse bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse bg-muted rounded" />
            <div className="h-4 w-32 animate-pulse bg-muted rounded" />
          </div>
        </div>
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Service not found
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          The service you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/services"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent transition-colors mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              {service.icon && (
                <span className="text-2xl">{service.icon}</span>
              )}
              <h1 className="text-2xl font-bold text-foreground">
                {service.name}
              </h1>
              <ServiceStatusBadge status={service.currentStatus} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {service.url && (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {service.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <button
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            {service.pingEnabled ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Resume
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          service={service}
          uptimeDetail={uptimeDetail}
          uptimeRange={uptimeRange}
          onRangeChange={setUptimeRange}
        />
      )}
      {activeTab === "logs" && <LogsTab serviceId={id} />}
      {activeTab === "alerts" && <AlertsTab serviceId={id} />}
      {activeTab === "settings" && (
        <div className="max-w-2xl">
          <ServiceForm
            defaultValues={{
              name: service.name,
              description: service.description ?? undefined,
              type: service.type,
              url: service.url ?? "",
              port: service.port ?? undefined,
              category: service.category ?? undefined,
              tags: service.tags,
              icon: service.icon ?? undefined,
              color: service.color ?? undefined,
              pingEnabled: service.pingEnabled,
              pingInterval: service.pingInterval,
              pingTimeout: service.pingTimeout,
              expectedStatus: service.expectedStatus,
              pingMethod: service.pingMethod,
            }}
            onSubmit={handleSettingsSave}
            isLoading={updateService.isPending}
            submitLabel="Save Changes"
          />
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Delete &quot;{service.name}&quot;?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete this service and all its monitoring
              data, logs, and alerts. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteService.isPending}
                className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteService.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Overview Tab ---------- */

interface OverviewTabProps {
  service: NonNullable<ReturnType<typeof useService>["data"]>["data"]
  uptimeDetail: {
    summary?: {
      uptimePercent: number
      avgResponseTime: number
      checksTotal: number
      checksUp: number
    }
    hourlyData?: Array<{
      hour: string
      up: number
      down: number
      degraded: number
      avgResponseTime: number
    }>
    incidents?: Array<{
      id: string
      status: string
      startedAt: string
      resolvedAt: string | null
      duration: number | null
      error: string | null
    }>
    checks?: Array<{
      id: string
      status: string
      responseTime: number | null
      checkedAt: string
    }>
  } | null | undefined
  uptimeRange: UptimeRange
  onRangeChange: (range: UptimeRange) => void
}

function OverviewTab({
  service,
  uptimeDetail,
  uptimeRange,
  onRangeChange,
}: OverviewTabProps) {
  if (!service) return null

  const summary = uptimeDetail?.summary
  const hourlyData = uptimeDetail?.hourlyData ?? []
  const incidents = uptimeDetail?.incidents ?? []
  const checks = uptimeDetail?.checks ?? []

  const responseTimeData = checks
    .filter((c) => c.responseTime !== null)
    .map((c) => ({
      time: format(new Date(c.checkedAt), "HH:mm"),
      responseTime: c.responseTime as number,
    }))

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Status</p>
          <ServiceStatusBadge status={service.currentStatus} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Checked</p>
          <p className="text-sm font-medium text-card-foreground">
            {service.lastCheckedAt
              ? formatDistanceToNow(new Date(service.lastCheckedAt), {
                  addSuffix: true,
                })
              : "Never"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Response</p>
          <p className="text-sm font-medium text-card-foreground">
            {summary ? `${Math.round(summary.avgResponseTime)}ms` : "--"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
          <p className="text-sm font-medium text-card-foreground">
            {summary ? `${summary.uptimePercent.toFixed(2)}%` : "--"}
          </p>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-1">
        {(["24h", "7d", "30d", "90d"] as UptimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              uptimeRange === r
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Uptime
          </h3>
          <UptimeChart data={hourlyData} />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Response Time
          </h3>
          <ResponseTimeChart data={responseTimeData} />
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">
          Recent Incidents
        </h3>
        {incidents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Shield className="h-4 w-4 text-green-500" />
            No incidents recorded in this time range
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
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
                  <p className="text-sm text-card-foreground">
                    Service went{" "}
                    <span
                      className={
                        incident.status === "DOWN"
                          ? "text-red-500 font-medium"
                          : "text-yellow-500 font-medium"
                      }
                    >
                      {incident.status.toLowerCase()}
                    </span>
                  </p>
                  {incident.error && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {incident.error}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      {format(
                        new Date(incident.startedAt),
                        "MMM d, HH:mm:ss"
                      )}
                    </span>
                    {incident.duration !== null && (
                      <span>
                        Duration:{" "}
                        {incident.duration < 60
                          ? `${incident.duration}s`
                          : `${Math.round(incident.duration / 60)}m`}
                      </span>
                    )}
                    {incident.resolvedAt && (
                      <span className="text-green-500">Resolved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Logs Tab ---------- */

function LogsTab({ serviceId }: { serviceId: string }) {
  const [logs, setLogs] = useState<
    Array<{
      id: string
      level: string
      message: string
      timestamp: string
      source: string | null
    }>
  >([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/services/${serviceId}/logs`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.data ?? [])
        setLogsLoading(false)
      })
      .catch(() => setLogsLoading(false))
  }, [serviceId])

  const levelColors: Record<string, string> = {
    DEBUG: "text-slate-400",
    INFO: "text-blue-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    FATAL: "text-red-600",
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-card-foreground">
          Service Logs
        </h3>
      </div>
      {logsLoading ? (
        <div className="p-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-5 animate-pulse bg-muted rounded w-full"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No logs available for this service
          </p>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap w-36">
                    {format(new Date(log.timestamp), "MMM dd HH:mm:ss")}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap w-16">
                    <span
                      className={`font-medium ${levelColors[log.level] ?? "text-muted-foreground"}`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-card-foreground">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------- Alerts Tab ---------- */

function AlertsTab({ serviceId }: { serviceId: string }) {
  const [alerts, setAlerts] = useState<
    Array<{
      id: string
      name: string
      type: string
      severity: string
      isEnabled: boolean
      lastFiredAt: string | null
    }>
  >([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/alerts?serviceId=${serviceId}`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data.data ?? [])
        setAlertsLoading(false)
      })
      .catch(() => setAlertsLoading(false))
  }, [serviceId])

  const severityColors: Record<string, string> = {
    INFO: "bg-blue-500/10 text-blue-500",
    WARNING: "bg-yellow-500/10 text-yellow-500",
    CRITICAL: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">
          Alert Rules
        </h3>
        <Link
          href={`/alerts/new?serviceId=${serviceId}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Bell className="h-3.5 w-3.5" />
          Create Alert
        </Link>
      </div>

      {alertsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse bg-muted rounded-lg"
            />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No alerts configured for this service
          </p>
          <Link
            href={`/alerts/new?serviceId=${serviceId}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create your first alert
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${alert.isEnabled ? "bg-green-500" : "bg-slate-400"}`}
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {alert.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.type.replace("_", " ")} &middot;{" "}
                    {alert.lastFiredAt
                      ? `Last fired ${formatDistanceToNow(new Date(alert.lastFiredAt), { addSuffix: true })}`
                      : "Never fired"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[alert.severity] ?? ""}`}
              >
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
