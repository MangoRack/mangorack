"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TIME_RANGES = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
]

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
]

export default function SettingsPage() {
  const [appName, setAppName] = useState("MangoLab")
  const [defaultTimeRange, setDefaultTimeRange] = useState("24h")
  const [timezone, setTimezone] = useState("UTC")
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("mangolab-settings")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.appName) setAppName(parsed.appName)
        if (parsed.defaultTimeRange) setDefaultTimeRange(parsed.defaultTimeRange)
        if (parsed.timezone) setTimezone(parsed.timezone)
      } catch {
        // ignore invalid JSON
      }
    }
    setLoaded(true)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      localStorage.setItem(
        "mangolab-settings",
        JSON.stringify({ appName, defaultTimeRange, timezone })
      )
      toast.success("Settings saved successfully.")
    } catch {
      toast.error("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">General</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your MangoLab instance.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* App Display Name */}
        <div className="space-y-2">
          <label
            htmlFor="appName"
            className="block text-sm font-medium text-foreground"
          >
            App Display Name
          </label>
          <input
            id="appName"
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="MangoLab"
          />
          <p className="text-xs text-muted-foreground">
            The name displayed in the browser tab and sidebar.
          </p>
        </div>

        {/* Default Time Range */}
        <div className="space-y-2">
          <label
            htmlFor="timeRange"
            className="block text-sm font-medium text-foreground"
          >
            Default Time Range
          </label>
          <select
            id="timeRange"
            value={defaultTimeRange}
            onChange={(e) => setDefaultTimeRange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TIME_RANGES.map((tr) => (
              <option key={tr.value} value={tr.value}>
                {tr.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            The default time range used for charts and data views.
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-foreground"
          >
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Times throughout the app will be displayed in this timezone.
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  )
}
