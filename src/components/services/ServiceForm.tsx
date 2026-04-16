"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { X, Lock, Loader2 } from "lucide-react"
import { useLicense } from "@/hooks/useLicense"

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  type: z.enum(["HTTP", "HTTPS", "TCP", "PING", "DNS", "CUSTOM"]),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  port: z
    .number()
    .int()
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535")
    .optional()
    .or(z.nan())
    .transform((v) => (v !== undefined && !isNaN(v) ? v : undefined)),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  pingEnabled: z.boolean().default(true),
  pingInterval: z.number().default(60),
  pingTimeout: z.number().default(10),
  expectedStatus: z.number().default(200),
  pingMethod: z.string().default("GET"),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormValues>
  onSubmit: (data: ServiceFormValues) => void
  isLoading: boolean
  submitLabel: string
}

const CATEGORIES = [
  "Web",
  "Database",
  "Game Server",
  "Media",
  "API",
  "Storage",
  "Network",
  "IoT",
  "Other",
]

export default function ServiceForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: ServiceFormProps) {
  const [tagInput, setTagInput] = useState("")
  const { isPro } = useLicense()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "HTTP",
      url: "",
      port: undefined,
      category: "",
      tags: [],
      icon: "",
      color: "#3b82f6",
      pingEnabled: true,
      pingInterval: 60,
      pingTimeout: 10,
      expectedStatus: 200,
      pingMethod: "GET",
      ...defaultValues,
    },
  })

  const serviceType = watch("type")
  const tags = watch("tags") ?? []
  const pingEnabled = watch("pingEnabled")
  const formValues = watch()

  const showUrl = ["HTTP", "HTTPS", "DNS"].includes(serviceType)
  const showPort = serviceType === "TCP"

  function addTag() {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    )
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1 - Basic Info */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">
          Basic Information
        </h2>
        <div className="grid gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="My Service"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              placeholder="Brief description of this service..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Service Type <span className="text-destructive">*</span>
            </label>
            <select
              {...register("type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="TCP">TCP</option>
              <option value="PING">PING</option>
              <option value="DNS">DNS</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
          </div>

          {/* URL (conditional) */}
          {showUrl && (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                URL{" "}
                {(serviceType === "HTTP" || serviceType === "HTTPS") && (
                  <span className="text-destructive">*</span>
                )}
              </label>
              <input
                {...register("url")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="https://example.com"
              />
              {errors.url && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.url.message}
                </p>
              )}
            </div>
          )}

          {/* Port (conditional) */}
          {showPort && (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Port
              </label>
              <input
                type="number"
                {...register("port", { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="8080"
              />
              {errors.port && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.port.message}
                </p>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Category
            </label>
            <input
              {...register("category")}
              list="categories"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Select or type a category"
            />
            <datalist id="categories">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Type a tag and press Enter"
            />
          </div>

          {/* Icon + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Icon (emoji)
              </label>
              <input
                {...register("icon")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="e.g. 🖥️"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register("color")}
                  className="h-10 w-10 rounded-md border border-input bg-background cursor-pointer"
                />
                <input
                  {...register("color")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Monitoring Config */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">
          Monitoring Configuration
        </h2>
        <div className="grid gap-5">
          {/* Enable monitoring toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Enable Monitoring
              </p>
              <p className="text-xs text-muted-foreground">
                Automatically check this service at the configured interval
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pingEnabled}
              onClick={() => setValue("pingEnabled", !pingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pingEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pingEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Ping Interval */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Check Interval
            </label>
            <select
              {...register("pingInterval", { valueAsNumber: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value={10} disabled={!isPro}>
                10 seconds {!isPro && "(PRO)"}
              </option>
              <option value={30} disabled={!isPro}>
                30 seconds {!isPro && "(PRO)"}
              </option>
              <option value={60}>60 seconds</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
            </select>
            {!isPro && (
              <div className="flex items-center gap-1 mt-1">
                <Lock className="h-3 w-3 text-violet-400" />
                <span className="bg-violet-500/10 text-violet-400 text-xs rounded-full px-2 py-0.5">
                  PRO
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  required for intervals under 60s
                </span>
              </div>
            )}
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Timeout
            </label>
            <select
              {...register("pingTimeout", { valueAsNumber: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>

          {/* Expected Status */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Expected Status Code
            </label>
            <input
              type="number"
              {...register("expectedStatus", { valueAsNumber: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="200"
            />
          </div>

          {/* HTTP Method */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              HTTP Method
            </label>
            <select
              {...register("pingMethod")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 3 - Review & Submit */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">
          Review
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <span className="text-muted-foreground">Name:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.name || "--"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.type}
            </span>
          </div>
          {formValues.url && (
            <div className="col-span-2">
              <span className="text-muted-foreground">URL:</span>
              <span className="ml-2 font-medium text-card-foreground break-all">
                {formValues.url}
              </span>
            </div>
          )}
          {formValues.port && !isNaN(formValues.port) && (
            <div>
              <span className="text-muted-foreground">Port:</span>
              <span className="ml-2 font-medium text-card-foreground">
                {formValues.port}
              </span>
            </div>
          )}
          {formValues.category && (
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium text-card-foreground">
                {formValues.category}
              </span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Monitoring:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.pingEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Interval:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.pingInterval}s
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Method:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.pingMethod}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Expected:</span>
            <span className="ml-2 font-medium text-card-foreground">
              {formValues.expectedStatus}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Tags:</span>
              <span className="ml-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground mr-1"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </section>
    </form>
  )
}
