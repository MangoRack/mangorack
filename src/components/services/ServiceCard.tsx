"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Globe, Server, Wifi, Radio, Cpu } from "lucide-react"
import ServiceStatusBadge from "./ServiceStatusBadge"
import type { ServiceWithNode } from "@/types/service"

interface ServiceCardProps {
  service: ServiceWithNode
}

const typeIcons: Record<string, React.ReactNode> = {
  HTTP: <Globe className="h-4 w-4" />,
  HTTPS: <Globe className="h-4 w-4" />,
  TCP: <Server className="h-4 w-4" />,
  PING: <Wifi className="h-4 w-4" />,
  DNS: <Radio className="h-4 w-4" />,
  CUSTOM: <Cpu className="h-4 w-4" />,
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/services/${service.id}`)}
      className="rounded-lg border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {service.icon ? (
            <span className="text-xl">{service.icon}</span>
          ) : (
            <span
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: service.color ?? "hsl(var(--primary))" }}
            >
              {service.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h3 className="font-semibold text-sm text-card-foreground leading-tight">
              {service.name}
            </h3>
            {service.url && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                {service.url}
              </p>
            )}
          </div>
        </div>
        <ServiceStatusBadge status={service.currentStatus} size="sm" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {typeIcons[service.type]}
          {service.type}
        </span>
        {service.port && (
          <span className="text-xs text-muted-foreground">:{service.port}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="text-xs text-muted-foreground">
          {service.lastCheckedAt
            ? formatDistanceToNow(new Date(service.lastCheckedAt), { addSuffix: true })
            : "Never checked"}
        </span>
      </div>

      {service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {service.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {service.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{service.tags.length - 3}
            </span>
          )}
        </div>
      )}

    </div>
  )
}
