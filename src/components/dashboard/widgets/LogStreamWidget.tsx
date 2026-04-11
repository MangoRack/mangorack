"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ScrollText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { WidgetWrapper } from "../WidgetWrapper"

interface LogEntry {
  id: string
  level: string
  message: string
  serviceName?: string
  service?: { name: string }
  createdAt: string
  timestamp?: string
}

interface LogStreamWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-slate-400",
  debug: "text-slate-400",
  INFO: "text-blue-500",
  info: "text-blue-500",
  WARN: "text-yellow-500",
  warn: "text-yellow-500",
  WARNING: "text-yellow-500",
  warning: "text-yellow-500",
  ERROR: "text-red-500",
  error: "text-red-500",
  FATAL: "text-red-500 font-bold",
  fatal: "text-red-500 font-bold",
}

const LEVEL_BG: Record<string, string> = {
  DEBUG: "bg-slate-400/10",
  debug: "bg-slate-400/10",
  INFO: "bg-blue-500/10",
  info: "bg-blue-500/10",
  WARN: "bg-yellow-500/10",
  warn: "bg-yellow-500/10",
  WARNING: "bg-yellow-500/10",
  warning: "bg-yellow-500/10",
  ERROR: "bg-red-500/10",
  error: "bg-red-500/10",
  FATAL: "bg-red-500/20",
  fatal: "bg-red-500/20",
}

const LEVELS = ["ALL", "DEBUG", "INFO", "WARN", "ERROR"] as const

export function LogStreamWidget({ id, dragHandleProps }: LogStreamWidgetProps) {
  const [levelFilter, setLevelFilter] = useState<string>("ALL")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["log-stream"],
    queryFn: () => fetch("/api/logs?limit=20").then((r) => r.json()),
    staleTime: 5000,
    refetchInterval: 5000,
  })

  const logs: LogEntry[] = Array.isArray((data as any)?.data) ? (data as any).data : []

  const filtered =
    levelFilter === "ALL"
      ? logs
      : logs.filter((l) => l.level.toUpperCase() === levelFilter)

  return (
    <WidgetWrapper
      id={id}
      title="Log Stream"
      icon={<ScrollText className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load logs" : null}
      onRefresh={refetch}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-2">
        {/* Level filters */}
        <div className="flex gap-1 flex-wrap">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                levelFilter === level
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Log entries */}
        <div className="space-y-1 max-h-[240px] overflow-y-auto font-mono text-[11px]">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No log entries
            </p>
          ) : (
            filtered.map((log) => {
              const color = LEVEL_COLORS[log.level] ?? "text-foreground"
              const bg = LEVEL_BG[log.level] ?? ""
              const ts = log.createdAt ?? log.timestamp
              const timeAgo = ts
                ? formatDistanceToNow(new Date(ts), { addSuffix: false })
                : ""
              const svcName = log.serviceName ?? log.service?.name ?? ""

              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded ${bg}`}
                >
                  <span
                    className={`shrink-0 w-12 text-right uppercase ${color}`}
                  >
                    {log.level.toUpperCase().slice(0, 5)}
                  </span>
                  <span className="flex-1 text-foreground break-all">
                    {svcName && (
                      <span className="text-muted-foreground">[{svcName}] </span>
                    )}
                    {log.message}
                  </span>
                  {timeAgo && (
                    <span className="shrink-0 text-muted-foreground text-[10px]">
                      {timeAgo}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* View all link */}
        <div className="pt-1 border-t border-border">
          <Link
            href="/logs"
            className="text-xs text-primary hover:underline"
          >
            View all logs
          </Link>
        </div>
      </div>
    </WidgetWrapper>
  )
}
