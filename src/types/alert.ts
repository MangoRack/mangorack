export type AlertType =
  | "SERVICE_DOWN"
  | "SERVICE_SLOW"
  | "HIGH_ERROR_RATE"
  | "LOG_PATTERN"
  | "METRIC_THRESHOLD"
  | "CUSTOM";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  id: string;
  name: string;
  serviceId: string | null;
  type: AlertType;
  condition: Record<string, unknown>;
  severity: AlertSeverity;
  isEnabled: boolean;
  cooldownMins: number;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  message: string;
  metadata: Record<string, unknown> | null;
  firedAt: string;
  resolvedAt: string | null;
}

export interface AlertWithEvents extends Alert {
  events: AlertEvent[];
}
