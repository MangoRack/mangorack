"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Bell, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  useAlerts,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
} from "@/hooks/useAlerts"
import { AlertList } from "@/components/alerts/AlertList"
import { AlertForm } from "@/components/alerts/AlertForm"
import { AlertBadge } from "@/components/alerts/AlertBadge"
import type { Alert, AlertEvent, AlertWithEvents } from "@/types/alert"
import { useLicense } from "@/hooks/useLicense"

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts()
  const createAlert = useCreateAlert()
  const updateAlert = useUpdateAlert()
  const deleteAlert = useDeleteAlert()
  const { isPro } = useLicense()
  const [showForm, setShowForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  const alertList = (alerts || []) as AlertWithEvents[]
  const alertCount = alertList.length
  const alertLimit = isPro ? 999999 : 3

  // Collect all events across alerts for the feed
  const allEvents: (AlertEvent & { alertName: string; severity: Alert["severity"] })[] =
    alertList
      .flatMap((a) =>
        (a.events || []).map((e) => ({
          ...e,
          alertName: a.name,
          severity: a.severity,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime()
      )
      .slice(0, 20)

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createAlert.mutateAsync(data as Partial<Alert>)
      toast.success("Alert created successfully")
      setShowForm(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create alert"
      )
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingAlert) return
    try {
      await updateAlert.mutateAsync({
        id: editingAlert.id,
        ...data,
      } as Partial<Alert> & { id: string })
      toast.success("Alert updated successfully")
      setEditingAlert(null)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update alert"
      )
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await updateAlert.mutateAsync({ id, isEnabled: enabled })
      toast.success(enabled ? "Alert enabled" : "Alert disabled")
    } catch {
      toast.error("Failed to toggle alert")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return
    try {
      await deleteAlert.mutateAsync(id)
      toast.success("Alert deleted")
    } catch {
      toast.error("Failed to delete alert")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Configure alert rules and view recent events
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          disabled={alertCount >= alertLimit}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Alert List */}
          <AlertList
            alerts={alertList}
            onToggle={handleToggle}
            onEdit={(alert) => setEditingAlert(alert)}
            onDelete={handleDelete}
          />

          {/* Free tier notice */}
          {!isPro && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-4 py-2.5 border border-border">
              You have {alertCount}/{alertLimit} alerts.{" "}
              <a
                href="/settings/license"
                className="text-primary hover:underline font-medium"
              >
                Upgrade to Pro
              </a>{" "}
              for up to 50 alerts.
            </div>
          )}

          {/* Alert Events Feed */}
          {allEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Recent Events</h2>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {allEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 text-sm ${
                      !event.resolvedAt
                        ? "bg-yellow-500/5"
                        : "hover:bg-muted/30"
                    } transition-colors`}
                  >
                    <AlertBadge severity={event.severity} />
                    <span className="font-medium truncate min-w-[120px]">
                      {event.alertName}
                    </span>
                    <span className="flex-1 text-muted-foreground truncate">
                      {event.message}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                      {format(
                        new Date(event.firedAt),
                        "MMM dd HH:mm:ss"
                      )}
                    </span>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
        </>
      )}

      {/* Create/Edit Form Dialog */}
      {showForm && (
        <AlertForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={createAlert.isPending}
        />
      )}
      {editingAlert && (
        <AlertForm
          alert={editingAlert}
          onSubmit={handleUpdate}
          onCancel={() => setEditingAlert(null)}
          isSubmitting={updateAlert.isPending}
        />
      )}
    </div>
  )
}
