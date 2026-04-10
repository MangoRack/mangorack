export type LicensePlan = "FREE" | "PRO" | "LIFETIME"

export interface LicenseValidationResult {
  valid: boolean
  plan: LicensePlan
  expiresAt?: Date
  error?: string
}

export interface LicenseStatus {
  plan: LicensePlan
  isValid: boolean
  features: LicenseFeatures
}

export interface LicenseFeatures {
  maxServices: number
  maxAlerts: number
  maxNodes: number
  logRetentionDays: number
  uptimeRetentionDays: number
  pingIntervalMin: number
  maxLogIngestionPerMin: number
  dashboardWidgets: number
  multiDashboard: boolean
  advancedAnalytics: boolean
  customWidgets: boolean
  apiAccess: boolean
  webhookAlerts: boolean
  discordAlerts: boolean
  slackAlerts: boolean
  exportData: boolean
  nodeTracking: boolean
  metricIngestion: boolean
  customPingHeaders: boolean
  tcpMonitoring: boolean
  dnsMonitoring: boolean
}

export interface LicenseValidateRequest {
  key: string
}

export interface LicenseValidateResponse {
  valid: boolean
  plan: LicensePlan
  expiresAt?: string
  features?: LicenseFeatures
  error?: string
}
