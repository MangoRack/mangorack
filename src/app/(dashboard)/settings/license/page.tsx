"use client"

import { useState, useEffect } from "react"
import { Crown, Check, X, Zap, Shield } from "lucide-react"
import { useLicense } from "@/hooks/useLicense"

const FEATURE_LABELS: Record<string, string> = {
  maxServices: "Services",
  maxAlerts: "Alert Rules",
  maxNodes: "Nodes",
  logRetentionDays: "Log Retention (days)",
  uptimeRetentionDays: "Uptime Retention (days)",
  pingIntervalMin: "Min Ping Interval (sec)",
  maxLogIngestionPerMin: "Log Ingestion / min",
  dashboardWidgets: "Dashboard Widgets",
  multiDashboard: "Multiple Dashboards",
  advancedAnalytics: "Advanced Analytics",
  customWidgets: "Custom Widgets",
  apiAccess: "API Access",
  webhookAlerts: "Webhook Alerts",
  discordAlerts: "Discord Alerts",
  slackAlerts: "Slack Alerts",
  exportData: "Data Export",
  nodeTracking: "Node Tracking",
  metricIngestion: "Metric Ingestion",
  customPingHeaders: "Custom Ping Headers",
  tcpMonitoring: "TCP Monitoring",
  dnsMonitoring: "DNS Monitoring",
}

const FREE_VALUES: Record<string, number | boolean> = {
  maxServices: 5,
  maxAlerts: 3,
  maxNodes: 1,
  logRetentionDays: 3,
  uptimeRetentionDays: 7,
  pingIntervalMin: 60,
  maxLogIngestionPerMin: 100,
  dashboardWidgets: 6,
  multiDashboard: false,
  advancedAnalytics: false,
  customWidgets: false,
  apiAccess: false,
  webhookAlerts: false,
  discordAlerts: false,
  slackAlerts: false,
  exportData: false,
  nodeTracking: false,
  metricIngestion: false,
  customPingHeaders: false,
  tcpMonitoring: false,
  dnsMonitoring: false,
}

const PRO_VALUES: Record<string, number | boolean> = {
  maxServices: 100,
  maxAlerts: 50,
  maxNodes: 20,
  logRetentionDays: 90,
  uptimeRetentionDays: 365,
  pingIntervalMin: 10,
  maxLogIngestionPerMin: 10000,
  dashboardWidgets: 50,
  multiDashboard: true,
  advancedAnalytics: true,
  customWidgets: true,
  apiAccess: true,
  webhookAlerts: true,
  discordAlerts: true,
  slackAlerts: true,
  exportData: true,
  nodeTracking: true,
  metricIngestion: true,
  customPingHeaders: true,
  tcpMonitoring: true,
  dnsMonitoring: true,
}

function formatValue(value: boolean | number): string {
  if (typeof value === "boolean") return ""
  return value.toLocaleString()
}

export default function LicenseSettingsPage() {
  const { plan, isPro, isLoading, validateKey, refreshStatus } = useLicense()
  const [licenseKey, setLicenseKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCurrentKey() {
      try {
        const res = await fetch("/api/license/status")
        if (res.ok) {
          const data = await res.json()
          if (data.isValid && data.key) {
            setMaskedKey(data.key)
          }
        }
      } catch {
        // Ignore
      }
    }
    fetchCurrentKey()
  }, [])

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseKey.trim()) return

    setIsValidating(true)
    setMessage(null)

    const result = await validateKey(licenseKey.trim())

    if (result.success) {
      setMessage({ type: "success", text: "License activated successfully!" })
      setLicenseKey("")
      setMaskedKey(
        licenseKey.substring(0, 11) +
          "***-*****-" +
          licenseKey.substring(licenseKey.length - 5)
      )
      await refreshStatus()
    } else {
      setMessage({
        type: "error",
        text: result.error || "Invalid license key",
      })
    }

    setIsValidating(false)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading license information...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">License</h2>
        <p className="text-muted-foreground mt-1">
          Manage your MangoLab license and view feature limits
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          {isPro ? (
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-orange-500" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{plan} Plan</h2>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "All features unlocked"
                : "Limited features. Upgrade for more."}
            </p>
          </div>
        </div>

        {maskedKey && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              Active License Key
            </p>
            <p className="font-mono text-sm">{maskedKey}</p>
          </div>
        )}
      </div>

      {/* License Key Input */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {isPro ? "Change License Key" : "Activate License"}
        </h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleValidate} className="flex gap-3">
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="MANGO-XXXXX-XXXXX-XXXXX-XXXXX"
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isValidating}
          />
          <button
            type="submit"
            disabled={isValidating || !licenseKey.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            <Zap className="h-4 w-4" />
            {isValidating ? "Validating..." : "Validate"}
          </button>
        </form>
      </div>

      {/* Feature Comparison */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold">Feature Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            See what each plan includes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b bg-muted/50">
                <th className="text-left text-sm font-medium px-6 py-3">
                  Feature
                </th>
                <th className="text-center text-sm font-medium px-6 py-3 w-32">
                  <div className="flex items-center justify-center gap-1.5">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Free
                  </div>
                </th>
                <th className="text-center text-sm font-medium px-6 py-3 w-32">
                  <div className="flex items-center justify-center gap-1.5">
                    <Crown className="h-4 w-4 text-orange-500" />
                    Pro
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(FEATURE_LABELS).map((key) => {
                const freeVal = FREE_VALUES[key]
                const proVal = PRO_VALUES[key]
                const isBool = typeof freeVal === "boolean"

                return (
                  <tr key={key} className="border-b last:border-b-0">
                    <td className="text-sm px-6 py-3">
                      {FEATURE_LABELS[key]}
                    </td>
                    <td className="text-center px-6 py-3">
                      {isBool ? (
                        freeVal ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {formatValue(freeVal)}
                        </span>
                      )}
                    </td>
                    <td className="text-center px-6 py-3">
                      {isBool ? (
                        proVal ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">
                          {formatValue(proVal)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
