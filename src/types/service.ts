export type ServiceType = "HTTP" | "HTTPS" | "TCP" | "PING" | "DNS" | "CUSTOM";
export type ServiceStatus = "UP" | "DOWN" | "DEGRADED" | "PAUSED" | "UNKNOWN";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  type: ServiceType;
  category: string | null;
  tags: string[];
  nodeId: string | null;
  port: number | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  isPinned: boolean;
  pingEnabled: boolean;
  pingInterval: number;
  pingTimeout: number;
  expectedStatus: number;
  pingMethod: string;
  pingHeaders: Record<string, string> | null;
  pingBody: string | null;
  currentStatus: ServiceStatus;
  lastCheckedAt: string | null;
  lastUpAt: string | null;
  lastDownAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithNode extends Service {
  node: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface ServiceWithChecks extends Service {
  uptimeChecks: UptimeCheck[];
}

export interface UptimeCheck {
  id: string;
  serviceId: string;
  status: ServiceStatus;
  responseTime: number | null;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
}

export interface UptimeSummary {
  serviceId: string;
  serviceName: string;
  currentStatus: ServiceStatus;
  uptimePercent: number;
  avgResponseTime: number;
  checksTotal: number;
  checksUp: number;
}
