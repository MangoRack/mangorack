"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react"
import type { AlertWithEvents, Alert } from "@/types/alert"
import { AlertBadge } from "./AlertBadge"

const TYPE_LABELS: Record<string, string> = {
  SERVICE_DOWN: "Service Down",
  SERVICE_SLOW: "Service Slow",
  HIGH_ERROR_RATE: "High Error Rate",
  LOG_PATTERN: "Log Pattern",
  METRIC_THRESHOLD: "Metric Threshold",
  CUSTOM: "Custom",
}

interface AlertListProps {
  alerts: AlertWithEvents[]
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (alert: Alert) => void
  onDelete: (id: string) => void
}

export function AlertList({
  alerts,
  onToggle,
  onEdit,
  onDelete,
}: AlertListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No alerts configured</p>
        <p className="text-xs mt-1">Create an alert to get started</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[44px_44px_1fr_120px_120px_100px_120px_80px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
        <div />
        <div>On</div>
        <div>Name</div>
        <div>Type</div>
        <div>Severity</div>
        <div>Last Fired</div>
        <div>Cooldown</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Rows */}
      {alerts.map((alert) => {
        const isExpanded = expandedId === alert.id
        const hasEvents = alert.events && alert.events.length > 0

        return (
          <div key={alert.id} className="border-b border-border last:border-b-0">
            <div
              className="grid grid-cols-[44px_44px_1fr_120px_120px_100px_120px_80px] gap-2 px-4 py-3 items-center text-sm hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() =>
                hasEvents &&
                setExpandedId(isExpanded ? null : alert.id)
              }
            >
              {/* Expand */}
              <div className="text-muted-foreground">
                {hasEvents &&
                  (isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ))}
              </div>

              {/* Toggle */}
              <div onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggle(alert.id, !alert.isEnabled)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    alert.isEnabled
                      ? "bg-green-500"
                      : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                      alert.isEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Name */}
              <div className="font-medium truncate">{alert.name}</div>

              {/* Type */}
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {TYPE_LABELS[alert.type] || alert.type}
                </span>
              </div>

              {/* Severity */}
              <div>
                <AlertBadge severity={alert.severity} />
              </div>

              {/* Last Fired */}
              <div className="text-xs text-muted-foreground">
                {alert.lastFiredAt
                  ? format(new Date(alert.lastFiredAt), "MMM dd HH:mm")
                  : "Never"}
              </div>

              {/* Cooldown */}
              <div className="text-xs text-muted-foreground">
                {alert.cooldownMins >= 60
                  ? `${Math.floor(alert.cooldownMins / 60)}h`
                  : `${alert.cooldownMins}m`}
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onEdit(alert)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(alert.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded events */}
            {isExpanded && hasEvents && (
              <div className="px-4 pb-3 pl-[88px]">
                <div className="space-y-2">
                  {alert.events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 text-xs rounded-md px-3 py-2 ${
                        event.resolvedAt
                          ? "bg-muted/30"
                          : "bg-yellow-500/10 border border-yellow-500/20"
                      }`}
                    >
                      <span className="text-muted-foreground font-mono">
                        {format(
                          new Date(event.firedAt),
                          "MMM dd HH:mm:ss"
                        )}
                      </span>
                      <span className="flex-1 truncate">{event.message}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          event.resolvedAt
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {event.resolvedAt ? "Resolved" : "Unresolved"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
