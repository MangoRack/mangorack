"use client"

import { useQuery } from "@tanstack/react-query"
import { Cpu } from "lucide-react"
import { WidgetWrapper } from "../WidgetWrapper"
import { useLicenseStore } from "@/stores/licenseStore"

interface NodeResource {
  id: string
  name: string
  cpuUsage?: number
  memoryUsage?: number
  cpu?: number
  memory?: number
}

interface ResourceUsageWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

function usageColor(pct: number): string {
  if (pct >= 80) return "bg-red-500"
  if (pct >= 60) return "bg-yellow-500"
  return "bg-green-500"
}

function usageTextColor(pct: number): string {
  if (pct >= 80) return "text-red-500"
  if (pct >= 60) return "text-yellow-500"
  return "text-green-500"
}

export function ResourceUsageWidget({ id, dragHandleProps }: ResourceUsageWidgetProps) {
  const plan = useLicenseStore((s) => s.plan)
  const isLocked = plan === "FREE"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resource-usage"],
    queryFn: () => fetch("/api/nodes").then((r) => r.json()),
    staleTime: 30000,
    enabled: !isLocked,
  })

  const nodes: NodeResource[] = Array.isArray(data) ? data : data?.data ?? data?.nodes ?? []

  return (
    <WidgetWrapper
      id={id}
      title="Resource Usage"
      icon={<Cpu className="w-4 h-4" />}
      isLoading={!isLocked && isLoading}
      error={!isLocked && error ? "Failed to load resource data" : null}
      onRefresh={refetch}
      isPro={isLocked}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4 max-h-[260px] overflow-y-auto">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cpu className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No nodes found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add a node to track resource usage</p>
          </div>
        ) : (
          nodes.map((node) => {
            const cpu = node.cpuUsage ?? node.cpu ?? 0
            const mem = node.memoryUsage ?? node.memory ?? 0
            return (
              <div key={node.id} className="space-y-2">
                <p className="text-sm font-medium text-foreground">{node.name}</p>
                {/* CPU */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">CPU</span>
                    <span className={`text-xs font-medium ${usageTextColor(cpu)}`}>
                      {cpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usageColor(cpu)}`}
                      style={{ width: `${Math.min(cpu, 100)}%` }}
                    />
                  </div>
                </div>
                {/* Memory */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">RAM</span>
                    <span className={`text-xs font-medium ${usageTextColor(mem)}`}>
                      {mem.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usageColor(mem)}`}
                      style={{ width: `${Math.min(mem, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </WidgetWrapper>
  )
}
