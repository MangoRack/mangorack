"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Pencil, Trash2, ArrowUpDown } from "lucide-react"
import ServiceStatusBadge from "./ServiceStatusBadge"
import type { ServiceWithNode } from "@/types/service"
import { useDeleteService } from "@/hooks/useServices"
import { toast } from "sonner"

interface ServiceTableProps {
  services: ServiceWithNode[]
}

type SortField =
  | "name"
  | "type"
  | "currentStatus"
  | "lastCheckedAt"

type SortDir = "asc" | "desc"

export default function ServiceTable({ services }: ServiceTableProps) {
  const router = useRouter()
  const deleteService = useDeleteService()
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = [...services].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case "name":
        cmp = a.name.localeCompare(b.name)
        break
      case "type":
        cmp = a.type.localeCompare(b.type)
        break
      case "currentStatus":
        cmp = a.currentStatus.localeCompare(b.currentStatus)
        break
      case "lastCheckedAt":
        cmp =
          new Date(a.lastCheckedAt ?? 0).getTime() -
          new Date(b.lastCheckedAt ?? 0).getTime()
        break
    }
    return sortDir === "desc" ? -cmp : cmp
  })

  function handleDelete(id: string) {
    deleteService.mutate(id, {
      onSuccess: () => {
        toast.success("Service deleted")
        setConfirmDeleteId(null)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  )

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">
                Status
              </th>
              <SortHeader field="name">Name</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                URL
              </th>
              <SortHeader field="type">Type</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Response
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Uptime 24h
              </th>
              <SortHeader field="lastCheckedAt">Last Check</SortHeader>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((service) => (
              <tr
                key={service.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push(`/services/${service.id}`)}
              >
                <td className="px-4 py-3">
                  <ServiceStatusBadge
                    status={service.currentStatus}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {service.icon ? (
                      <span className="text-base">{service.icon}</span>
                    ) : (
                      <span
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{
                          backgroundColor:
                            service.color ?? "hsl(var(--primary))",
                        }}
                      >
                        {service.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-sm font-medium text-card-foreground">
                      {service.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {service.url ?? "--"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {service.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  --ms
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-green-500/10 text-green-500 px-2 py-0.5 text-xs font-medium">
                    99.9%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {service.lastCheckedAt
                    ? formatDistanceToNow(new Date(service.lastCheckedAt), {
                        addSuffix: true,
                      })
                    : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        router.push(`/services/${service.id}?tab=settings`)
                      }
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(service.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Delete Service
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this service? This action cannot be
              undone. All monitoring data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleteService.isPending}
                className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteService.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
