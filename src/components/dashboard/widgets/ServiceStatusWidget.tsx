"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Server } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { WidgetWrapper } from "../WidgetWrapper"

interface Service {
  id: string
  name: string
  status: string
  lastCheckedAt?: string | null
  updatedAt?: string
}

interface ServiceStatusWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

const STATUS_DOT: Record<string, string> = {
  UP: "bg-green-500",
  up: "bg-green-500",
  DOWN: "bg-red-500",
  down: "bg-red-500",
  DEGRADED: "bg-yellow-500",
  degraded: "bg-yellow-500",
}

const TABS = ["All", "Up", "Down"] as const

export function ServiceStatusWidget({ id, dragHandleProps }: ServiceStatusWidgetProps) {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]>("All")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["services-status"],
    queryFn: () => fetch("/api/services").then((r) => r.json()),
    staleTime: 30000,
  })

  const raw = data as any
  const services: any[] = Array.isArray(raw?.data) ? raw.data : []

  const filtered = services.filter((s: any) => {
    const status = (s.currentStatus || s.status || "").toUpperCase()
    if (tab === "All") return true
    if (tab === "Up") return status === "UP"
    if (tab === "Down") return status === "DOWN"
    return true
  })

  return (
    <WidgetWrapper
      id={id}
      title="Service Status"
      icon={<Server className="w-4 h-4" />}
      isLoading={isLoading}
      error={error ? "Failed to load services" : null}
      onRefresh={refetch}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-md p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                tab === t
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Service grid */}
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No services found
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
            {filtered.map((service) => {
              const dot = STATUS_DOT[service.currentStatus || service.status] ?? "bg-slate-400"
              const lastCheck = service.lastCheckedAt ?? service.updatedAt
              const timeAgo = lastCheck
                ? formatDistanceToNow(new Date(lastCheck), { addSuffix: false }) + " ago"
                : "Never"

              return (
                <button
                  key={service.id}
                  onClick={() => router.push(`/services/${service.id}`)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {service.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
