"use client"

import { useQuery } from "@tanstack/react-query"
import { Network } from "lucide-react"
import { WidgetWrapper } from "../WidgetWrapper"
import { useLicenseStore } from "@/stores/licenseStore"

interface Node {
  id: string
  name: string
  status?: string
}

interface Service {
  id: string
  name: string
  status: string
  nodeId?: string | null
  node?: { id: string; name: string } | null
}

interface NetworkWidgetProps {
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

export function NetworkWidget({ id, dragHandleProps }: NetworkWidgetProps) {
  const plan = useLicenseStore((s) => s.plan)
  const isLocked = plan === "FREE"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["network-map"],
    queryFn: async () => {
      const [servicesRes, nodesRes] = await Promise.all([
        fetch("/api/services").then((r) => r.json()),
        fetch("/api/nodes").then((r) => r.json()),
      ])
      return { services: servicesRes, nodes: nodesRes }
    },
    staleTime: 30000,
    enabled: !isLocked,
  })

  const services: Service[] = Array.isArray(data?.services?.data) ? data.services.data : []
  const nodes: Node[] = Array.isArray(data?.nodes?.data) ? data.nodes.data : []

  // Group services by node
  const grouped = new Map<string, { node: Node; services: Service[] }>()

  for (const node of nodes) {
    grouped.set(node.id, { node, services: [] })
  }

  const ungrouped: Service[] = []
  for (const svc of services) {
    const nodeId = svc.nodeId ?? svc.node?.id
    if (nodeId && grouped.has(nodeId)) {
      grouped.get(nodeId)!.services.push(svc)
    } else {
      ungrouped.push(svc)
    }
  }

  return (
    <WidgetWrapper
      id={id}
      title="Network Map"
      icon={<Network className="w-4 h-4" />}
      isLoading={!isLocked && isLoading}
      error={!isLocked && error ? "Failed to load network data" : null}
      onRefresh={refetch}
      isPro={isLocked}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {nodes.length === 0 && ungrouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No nodes or services found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Your network topology will appear here</p>
          </div>
        ) : (
          <>
            {Array.from(grouped.values()).map(({ node, services: nodeSvcs }) => (
              <div key={node.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[node.status ?? ""] ?? "bg-slate-400"}`} />
                  <span className="text-sm font-medium text-foreground">
                    {node.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({nodeSvcs.length} services)
                  </span>
                </div>
                {nodeSvcs.length > 0 ? (
                  <div className="ml-4 flex flex-wrap gap-2">
                    {nodeSvcs.map((svc) => (
                      <span
                        key={svc.id}
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[svc.status] ?? "bg-slate-400"}`} />
                        {svc.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="ml-4 text-[10px] text-muted-foreground">
                    No services on this node
                  </p>
                )}
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-sm font-medium text-foreground">
                    Unassigned
                  </span>
                </div>
                <div className="ml-4 flex flex-wrap gap-2">
                  {ungrouped.map((svc) => (
                    <span
                      key={svc.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[svc.status] ?? "bg-slate-400"}`} />
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </WidgetWrapper>
  )
}
