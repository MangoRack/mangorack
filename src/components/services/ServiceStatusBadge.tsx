"use client"

import type { ServiceStatus } from "@/types/service"

interface ServiceStatusBadgeProps {
  status: ServiceStatus
  size?: "sm" | "md"
}

const statusConfig: Record<
  ServiceStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  UP: {
    label: "Up",
    dotClass: "bg-green-500",
    bgClass: "bg-green-500/10",
    textClass: "text-green-500",
  },
  DOWN: {
    label: "Down",
    dotClass: "bg-red-500",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
  DEGRADED: {
    label: "Degraded",
    dotClass: "bg-yellow-500",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-500",
  },
  PAUSED: {
    label: "Paused",
    dotClass: "bg-slate-400",
    bgClass: "bg-slate-400/10",
    textClass: "text-slate-400",
  },
  UNKNOWN: {
    label: "Unknown",
    dotClass: "bg-slate-400",
    bgClass: "bg-slate-400/10",
    textClass: "text-slate-400",
  },
}

export default function ServiceStatusBadge({
  status,
  size = "md",
}: ServiceStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.UNKNOWN

  const sizeClasses =
    size === "sm" ? "px-1.5 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs gap-1.5"
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgClass} ${config.textClass} ${sizeClasses}`}
    >
      <span className="relative flex">
        <span
          className={`${dotSize} rounded-full ${config.dotClass}`}
        />
        {(status === "UP" || status === "DOWN") && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dotClass} opacity-75`}
          />
        )}
      </span>
      {config.label}
    </span>
  )
}
