"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Mail,
  Globe,
  Lock,
  Send,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const notificationSchema = z.object({
  emailEnabled: z.boolean(),
  email: z.string().email().or(z.literal("")),
  emailSeverities: z.array(z.enum(["INFO", "WARNING", "CRITICAL"])),
  webhookEnabled: z.boolean(),
  webhookUrl: z.string().url().or(z.literal("")),
  webhookSeverities: z.array(z.enum(["INFO", "WARNING", "CRITICAL"])),
  discordEnabled: z.boolean(),
  discordWebhookUrl: z.string().url().or(z.literal("")),
  discordSeverities: z.array(z.enum(["INFO", "WARNING", "CRITICAL"])),
  slackEnabled: z.boolean(),
  slackWebhookUrl: z.string().url().or(z.literal("")),
  slackSeverities: z.array(z.enum(["INFO", "WARNING", "CRITICAL"])),
})

type NotificationSettings = z.infer<typeof notificationSchema>

const defaultSettings: NotificationSettings = {
  emailEnabled: false,
  email: "",
  emailSeverities: ["WARNING", "CRITICAL"],
  webhookEnabled: false,
  webhookUrl: "",
  webhookSeverities: ["WARNING", "CRITICAL"],
  discordEnabled: false,
  discordWebhookUrl: "",
  discordSeverities: ["WARNING", "CRITICAL"],
  slackEnabled: false,
  slackWebhookUrl: "",
  slackSeverities: ["WARNING", "CRITICAL"],
}

const SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const

function SeverityCheckboxes({
  values,
  onChange,
  channelId,
}: {
  values: string[]
  onChange: (values: string[]) => void
  channelId: string
}) {
  const colors: Record<string, string> = {
    INFO: "bg-blue-500",
    WARNING: "bg-yellow-500",
    CRITICAL: "bg-red-500",
  }

  return (
    <div className="flex items-center gap-3 mt-1">
      {SEVERITIES.map((sev) => {
        const id = `${channelId}-severity-${sev.toLowerCase()}`
        return (
          <label key={sev} htmlFor={id} className="flex items-center gap-1.5 cursor-pointer">
            <span className="relative inline-flex items-center justify-center h-3.5 w-3.5">
              <input
                id={id}
                type="checkbox"
                className="sr-only peer"
                checked={values.includes(sev)}
                onChange={() => {
                  const next = values.includes(sev)
                    ? values.filter((v) => v !== sev)
                    : [...values, sev]
                  onChange(next)
                }}
              />
              <span
                className={`absolute inset-0 rounded border-2 flex items-center justify-center transition-colors ${
                  values.includes(sev)
                    ? `${colors[sev]} border-transparent`
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              >
                {values.includes(sev) && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{sev}</span>
          </label>
        )
      })}
    </div>
  )
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/notifications")
      if (!res.ok) return defaultSettings
      const json = await res.json()
      return (json.data || defaultSettings) as NotificationSettings
    },
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSchema),
    defaultValues: defaultSettings,
  })

  useEffect(() => {
    if (settings) {
      reset(settings)
    }
  }, [settings, reset])

  const saveMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notificationSettings"],
      })
      toast.success("Notification settings saved")
    },
    onError: () => {
      toast.error("Failed to save settings")
    },
  })

  const sendTest = async (channel: string) => {
    try {
      const res = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, ...getValues() }),
      })
      if (!res.ok) throw new Error("Test failed")
      toast.success(`Test ${channel} notification sent`)
    } catch {
      toast.error(`Failed to send test ${channel} notification`)
    }
  }

  const inputClass =
    "w-full h-9 px-3 text-sm bg-secondary text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Configure how you receive alert notifications
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
        className="space-y-6"
      >
        {/* Email */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <Controller
              control={control}
              name="emailEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Enable Email"
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
          <div className="flex gap-2">
            <label htmlFor="email-input" className="sr-only">Email address</label>
            <input
              {...register("email")}
              id="email-input"
              type="email"
              placeholder="your@email.com"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => sendTest("email")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Send className="h-3 w-3" />
              Send Test
            </button>
          </div>
          <Controller
            control={control}
            name="emailSeverities"
            render={({ field }) => (
              <SeverityCheckboxes
                values={field.value}
                onChange={field.onChange}
                channelId="email"
              />
            )}
          />
        </div>

        {/* Webhook */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Webhook</span>
            </div>
            <Controller
              control={control}
              name="webhookEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Enable Webhook"
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
          <div className="flex gap-2">
            <label htmlFor="webhook-url-input" className="sr-only">Webhook URL</label>
            <input
              {...register("webhookUrl")}
              id="webhook-url-input"
              type="url"
              placeholder="https://your-webhook-url.com/hook"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => sendTest("webhook")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Send className="h-3 w-3" />
              Send Test
            </button>
          </div>
          <Controller
            control={control}
            name="webhookSeverities"
            render={({ field }) => (
              <SeverityCheckboxes
                values={field.value}
                onChange={field.onChange}
                channelId="webhook"
              />
            )}
          />
        </div>

        {/* Discord (PRO) */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="text-sm font-medium">Discord</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold leading-none">
                PRO
              </span>
            </div>
            <Controller
              control={control}
              name="discordEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Enable Discord"
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
          <div className="flex gap-2">
            <label htmlFor="discord-webhook-url-input" className="sr-only">Discord Webhook URL</label>
            <input
              {...register("discordWebhookUrl")}
              id="discord-webhook-url-input"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => sendTest("discord")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Send className="h-3 w-3" />
              Send Test
            </button>
          </div>
          <Controller
            control={control}
            name="discordSeverities"
            render={({ field }) => (
              <SeverityCheckboxes
                values={field.value}
                onChange={field.onChange}
                channelId="discord"
              />
            )}
          />
        </div>

        {/* Slack (PRO) */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52a2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521a2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521a2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523a2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              <span className="text-sm font-medium">Slack</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold leading-none">
                PRO
              </span>
            </div>
            <Controller
              control={control}
              name="slackEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Enable Slack"
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
          <div className="flex gap-2">
            <label htmlFor="slack-webhook-url-input" className="sr-only">Slack Webhook URL</label>
            <input
              {...register("slackWebhookUrl")}
              id="slack-webhook-url-input"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => sendTest("slack")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Send className="h-3 w-3" />
              Send Test
            </button>
          </div>
          <Controller
            control={control}
            name="slackSeverities"
            render={({ field }) => (
              <SeverityCheckboxes
                values={field.value}
                onChange={field.onChange}
                channelId="slack"
              />
            )}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || saveMutation.isPending}
            className="flex items-center gap-1.5 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
