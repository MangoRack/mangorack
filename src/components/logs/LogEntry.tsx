"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { LogEntry as LogEntryType } from "@/types/log"
import Link from "next/link"

const LEVEL_STYLES: Record<string, string> = {
  DEBUG: "bg-slate-400/20 text-slate-400",
  INFO: "bg-blue-400/20 text-blue-400",
  WARN: "bg-yellow-400/20 text-yellow-400",
  ERROR: "bg-red-400/20 text-red-400",
  FATAL: "bg-red-600/20 text-red-600 font-bold",
}

interface LogEntryProps {
  log: LogEntryType
  serviceName?: string
  isEven?: boolean
}

export function LogEntryRow({ log, serviceName, isEven }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMetadata =
    log.metadata && Object.keys(log.metadata).length > 0

  return (
    <div
      className={`${isEven ? "bg-muted/30" : "bg-transparent"} hover:bg-muted/50 transition-colors`}
    >
      <div className="flex items-start gap-3 px-4 py-2 text-sm">
        {/* Expand button */}
        <button
          onClick={() => hasMetadata && setExpanded(!expanded)}
          className={`mt-0.5 flex-shrink-0 ${hasMetadata ? "cursor-pointer text-muted-foreground hover:text-foreground" : "invisible"}`}
          disabled={!hasMetadata}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Timestamp */}
        <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-[130px]">
          {format(new Date(log.timestamp), "MMM dd HH:mm:ss")}
        </span>

        {/* Level pill */}
        <span
          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium w-[60px] text-center ${LEVEL_STYLES[log.level] || LEVEL_STYLES.INFO}`}
        >
          {log.level}
        </span>

        {/* Service */}
        {log.serviceId && (
          <Link
            href={`/services/${log.serviceId}`}
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {serviceName || log.serviceId.slice(0, 8)}
          </Link>
        )}

        {/* Source */}
        {log.source && (
          <span className="flex-shrink-0 text-xs text-muted-foreground/70 w-[80px] truncate">
            {log.source}
          </span>
        )}

        {/* Message */}
        <span className="flex-1 min-w-0 truncate text-foreground">
          {log.message}
        </span>
      </div>

      {/* Expanded metadata */}
      {expanded && hasMetadata && (
        <div className="px-4 pb-3 pl-[54px]">
          <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground font-mono">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
