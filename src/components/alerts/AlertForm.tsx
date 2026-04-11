"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Lock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import Dialog from "@/components/ui/Dialog"
import type { Alert, AlertType, AlertSeverity } from "@/types/alert"
import type { ApiResponse } from "@/types/api"

const alertSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  serviceId: z.string().optional(),
  type: z.enum([
    "SERVICE_DOWN",
    "SERVICE_SLOW",
    "HIGH_ERROR_RATE",
    "LOG_PATTERN",
    "METRIC_THRESHOLD",
    "CUSTOM",
  ]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  cooldownMins: z.number().min(1),
  isEnabled: z.boolean(),
  condition: z.record(z.unknown()),
})

type AlertFormData = z.infer<typeof alertSchema>

const ALERT_TYPES: { value: AlertType; label: string; pro?: boolean }[] = [
  { value: "SERVICE_DOWN", label: "Service Down" },
  { value: "SERVICE_SLOW", label: "Service Slow" },
  { value: "HIGH_ERROR_RATE", label: "High Error Rate" },
  { value: "LOG_PATTERN", label: "Log Pattern" },
  { value: "METRIC_THRESHOLD", label: "Metric Threshold", pro: true },
]

const COOLDOWN_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "24 hours", value: 1440 },
]

const SEVERITY_OPTIONS: {
  value: AlertSeverity
  label: string
  color: string
}[] = [
  { value: "INFO", label: "Info", color: "bg-blue-500" },
  { value: "WARNING", label: "Warning", color: "bg-yellow-500" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-500" },
]

interface AlertFormProps {
  alert?: Alert | null
  onSubmit: (data: AlertFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function AlertForm({
  alert,
  onSubmit,
  onCancel,
  isSubmitting,
}: AlertFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: alert?.name || "",
      serviceId: alert?.serviceId || "",
      type: alert?.type || "SERVICE_DOWN",
      severity: alert?.severity || "WARNING",
      cooldownMins: alert?.cooldownMins || 15,
      isEnabled: alert?.isEnabled ?? true,
      condition: alert?.condition || {},
    },
  })

  const alertType = watch("type")
  const condition = watch("condition")

  const { data: servicesData } = useQuery<
    ApiResponse<Array<{ id: string; name: string }>>
  >({
    queryKey: ["servicesList"],
    queryFn: async () => {
      const res = await fetch("/api/services?limit=100")
      if (!res.ok) throw new Error("Failed to fetch services")
      return res.json()
    },
  })

  const services = (servicesData?.data || []) as Array<{
    id: string
    name: string
  }>

  // Reset condition when type changes
  useEffect(() => {
    if (!alert) {
      setValue("condition", {})
    }
  }, [alertType, alert, setValue])

  const inputClass =
    "w-full h-9 px-3 text-sm bg-secondary text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
  const labelClass = "text-sm font-medium text-foreground"

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      title={alert ? "Edit Alert" : "Create Alert"}
      className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl px-6 py-4"
    >
        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>Name</label>
            <input
              {...register("name")}
              placeholder="Alert name"
              className={inputClass}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <label className={labelClass}>Service (optional)</label>
            <select {...register("serviceId")} className={inputClass}>
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Type */}
          <div className="space-y-1.5">
            <label className={labelClass}>Alert Type</label>
            <select {...register("type")} className={inputClass}>
              {ALERT_TYPES.map((t) => (
                <option key={t.value} value={t.value} disabled={t.pro}>
                  {t.label}
                  {t.pro ? " (PRO)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic condition fields */}
          {alertType === "SERVICE_SLOW" && (
            <div className="space-y-1.5">
              <label className={labelClass}>
                Response time above (ms)
              </label>
              <input
                type="number"
                value={(condition.responseTimeMs as number) || ""}
                onChange={(e) =>
                  setValue("condition", {
                    ...condition,
                    responseTimeMs: Number(e.target.value),
                  })
                }
                placeholder="1000"
                className={inputClass}
              />
            </div>
          )}

          {alertType === "HIGH_ERROR_RATE" && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className={labelClass}>Error rate above (%)</label>
                <input
                  type="number"
                  value={(condition.errorRatePercent as number) || ""}
                  onChange={(e) =>
                    setValue("condition", {
                      ...condition,
                      errorRatePercent: Number(e.target.value),
                    })
                  }
                  placeholder="5"
                  className={inputClass}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className={labelClass}>In last (minutes)</label>
                <input
                  type="number"
                  value={(condition.windowMins as number) || ""}
                  onChange={(e) =>
                    setValue("condition", {
                      ...condition,
                      windowMins: Number(e.target.value),
                    })
                  }
                  placeholder="15"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {alertType === "LOG_PATTERN" && (
            <div className="space-y-1.5">
              <label className={labelClass}>Message matches (regex)</label>
              <input
                type="text"
                value={(condition.pattern as string) || ""}
                onChange={(e) =>
                  setValue("condition", {
                    ...condition,
                    pattern: e.target.value,
                  })
                }
                placeholder="error|exception|failed"
                className={inputClass}
              />
            </div>
          )}

          {alertType === "METRIC_THRESHOLD" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border">
                <Lock className="h-3.5 w-3.5" />
                This alert type requires a Pro license.
              </div>
              <div className="space-y-1.5 opacity-50 pointer-events-none">
                <label className={labelClass}>Metric name</label>
                <input
                  type="text"
                  placeholder="cpu_usage"
                  className={inputClass}
                  disabled
                />
              </div>
              <div className="flex gap-3 opacity-50 pointer-events-none">
                <div className="w-[120px] space-y-1.5">
                  <label className={labelClass}>Operator</label>
                  <select className={inputClass} disabled>
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className={labelClass}>Value</label>
                  <input
                    type="number"
                    placeholder="90"
                    className={inputClass}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Severity */}
          <div className="space-y-1.5">
            <label className={labelClass}>Severity</label>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                        field.value === opt.value
                          ? `${opt.color} text-white border-transparent`
                          : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Cooldown */}
          <div className="space-y-1.5">
            <label className={labelClass}>Cooldown</label>
            <select
              {...register("cooldownMins", { valueAsNumber: true })}
              className={inputClass}
            >
              {COOLDOWN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <label className={labelClass}>Enabled</label>
            <Controller
              control={control}
              name="isEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    field.value ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      field.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : alert
                ? "Update Alert"
                : "Create Alert"}
          </button>
        </div>
    </Dialog>
  )
}
