export type WidgetSize = "small" | "medium" | "large"

export interface WidgetConfig {
  id: string
  type: string
  size: WidgetSize
  position: number
}

export interface DashboardState {
  widgets: WidgetConfig[]
  isEditMode: boolean
  isLoading: boolean
  setEditMode: (edit: boolean) => void
  moveWidget: (activeId: string, overId: string) => void
  resizeWidget: (id: string, size: WidgetSize) => void
  removeWidget: (id: string) => void
  addWidget: (type: string, size?: WidgetSize) => void
  loadLayout: () => Promise<void>
  saveLayout: () => Promise<void>
}

export type WidgetType =
  | "quick_stats"
  | "service_status"
  | "uptime_summary"
  | "log_stream"
  | "alerts_feed"
  | "response_time"
  | "metrics_chart"
  | "network_map"
  | "resource_usage"
  | "quick_actions"

export interface WidgetDefinition {
  type: WidgetType
  name: string
  description: string
  defaultSize: WidgetSize
  isPro: boolean
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { type: "quick_stats", name: "Quick Stats", description: "Key metrics at a glance", defaultSize: "medium", isPro: false },
  { type: "service_status", name: "Service Status", description: "Status of all monitored services", defaultSize: "medium", isPro: false },
  { type: "uptime_summary", name: "Uptime Summary", description: "Overall uptime percentage and trends", defaultSize: "medium", isPro: false },
  { type: "log_stream", name: "Log Stream", description: "Live log tail from your services", defaultSize: "medium", isPro: false },
  { type: "alerts_feed", name: "Alerts Feed", description: "Recent alert events", defaultSize: "medium", isPro: false },
  { type: "response_time", name: "Response Time", description: "Response time metrics chart", defaultSize: "large", isPro: false },
  { type: "metrics_chart", name: "Metrics Chart", description: "CPU and memory metrics over time", defaultSize: "large", isPro: true },
  { type: "network_map", name: "Network Map", description: "Service topology grouped by node", defaultSize: "large", isPro: true },
  { type: "resource_usage", name: "Resource Usage", description: "CPU and RAM usage per node", defaultSize: "medium", isPro: true },
  { type: "quick_actions", name: "Quick Actions", description: "Common action shortcuts", defaultSize: "small", isPro: false },
]

export const PRO_WIDGET_TYPES = WIDGET_DEFINITIONS.filter(w => w.isPro).map(w => w.type)

export interface TimeRange {
  label: string
  value: string
}

export const TIME_RANGES: TimeRange[] = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
]
