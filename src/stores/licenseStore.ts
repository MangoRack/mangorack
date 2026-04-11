import { create } from "zustand"
import { logger } from "@/lib/logger"

type Plan = "FREE" | "PRO" | "LIFETIME"

const FREE_FEATURES: Record<string, boolean | number> = {
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

const PRO_FEATURES: Record<string, boolean | number> = {
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

function getFeaturesForPlan(plan: Plan): Record<string, boolean | number> {
  return plan === "PRO" || plan === "LIFETIME" ? PRO_FEATURES : FREE_FEATURES
}

interface LicenseState {
  plan: Plan
  isValid: boolean
  features: Record<string, boolean | number>
  isLoading: boolean
  refreshStatus: () => Promise<void>
  validateKey: (key: string) => Promise<{ success: boolean; error?: string }>
}

export const useLicenseStore = create<LicenseState>((set) => ({
  plan: "FREE",
  isValid: false,
  features: FREE_FEATURES,
  isLoading: true,

  refreshStatus: async () => {
    try {
      set({ isLoading: true })
      const res = await fetch("/api/license/status")
      if (!res.ok) throw new Error("Failed to fetch license status")
      const json = await res.json()
      const status = json.data
      const plan: Plan = status?.plan || "FREE"
      set({
        plan,
        isValid: status?.isValid ?? false,
        features: getFeaturesForPlan(plan),
        isLoading: false,
      })
    } catch (error) {
      logger.error("Failed to refresh license status:", error)
      set({ isLoading: false })
    }
  },

  validateKey: async (key: string) => {
    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      const json = await res.json()

      if (!res.ok) {
        return { success: false, error: json.error?.message || "Invalid license key" }
      }

      const result = json.data
      if (!result?.valid) {
        return { success: false, error: result?.error || "Invalid license key" }
      }

      const plan: Plan = result.plan || "FREE"
      set({
        plan,
        isValid: true,
        features: getFeaturesForPlan(plan),
      })

      return { success: true }
    } catch (error) {
      logger.error("Failed to validate license key:", error)
      return { success: false, error: "Failed to validate license key" }
    }
  },
}))
