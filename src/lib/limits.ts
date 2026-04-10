import { getCurrentLicensePlan } from "./license"

export const FREE_LIMITS = {
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
} as const

export const PRO_LIMITS = {
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
} as const

export type LimitKey = keyof typeof FREE_LIMITS
export type LimitsMap = { [K in LimitKey]: typeof FREE_LIMITS[K] | typeof PRO_LIMITS[K] }

export async function getLimits(): Promise<LimitsMap> {
  const plan = await getCurrentLicensePlan()
  return (plan === "FREE" ? FREE_LIMITS : PRO_LIMITS) as LimitsMap
}

export async function checkLimit(feature: LimitKey): Promise<boolean> {
  const limits = await getLimits()
  return !!limits[feature]
}

export async function enforceLimit(
  feature: LimitKey,
  currentCount?: number
): Promise<void> {
  const limits = await getLimits()
  const limit = limits[feature]
  if (typeof limit === "boolean" && !limit) {
    throw new LimitError(feature)
  }
  if (
    typeof limit === "number" &&
    currentCount !== undefined &&
    currentCount >= limit
  ) {
    throw new LimitError(feature)
  }
}

export class LimitError extends Error {
  code = "LIMIT_EXCEEDED" as const
  status = 403 as const
  upgrade = true as const
  constructor(feature: string) {
    super(
      `Free tier limit reached for ${feature}. Upgrade to Pro for higher limits.`
    )
    this.name = "LimitError"
  }
}

export async function getLicensePlan() {
  return getCurrentLicensePlan()
}

const RESOURCE_LIMITS: Record<string, Record<string, number>> = {
  FREE: { services: 5, alerts: 3, nodes: 1 },
  PRO: { services: 100, alerts: 50, nodes: 20 },
  LIFETIME: { services: 100, alerts: 50, nodes: 20 },
}

export function checkLimits(plan: string, resource: string): number {
  return RESOURCE_LIMITS[plan]?.[resource] ?? RESOURCE_LIMITS.FREE[resource] ?? 0
}

export function getRetentionDays(plan: string): number {
  if (plan === "PRO" || plan === "LIFETIME") return 90
  return 3
}

export async function getFeatureStatus() {
  const plan = await getCurrentLicensePlan()
  const limits = plan === "FREE" ? FREE_LIMITS : PRO_LIMITS
  return { plan, isValid: plan !== "FREE", features: limits }
}
