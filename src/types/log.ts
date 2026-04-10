export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  id: string;
  serviceId: string | null;
  level: LogLevel;
  message: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface LogFilter {
  level?: LogLevel;
  serviceId?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
  cursor?: string;
}
