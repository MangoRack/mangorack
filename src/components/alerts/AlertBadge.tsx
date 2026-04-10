"use client"

import { AlertTriangle, Info, AlertOctagon } from "lucide-react"
import type { AlertSeverity } from "@/types/alert"

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { bg: string; text: string; icon: React.ElementType }
> = {
  INFO: { bg: "bg-blue-500/20", text: "text-blue-500", icon: Info },
  WARNING: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-500",
    icon: AlertTriangle,
  },
  CRITICAL: {
    bg: "bg-red-500/20",
    text: "text-red-500",
    icon: AlertOctagon,
  },
}

interface AlertBadgeProps {
  severity: AlertSeverity
}

export function AlertBadge({ severity }: AlertBadgeProps) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.INFO
  const Icon = style.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <Icon className="h-3 w-3" />
      {severity}
    </span>
  )
}
