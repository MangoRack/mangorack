import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";
import { getLicensePlan } from "@/lib/limits";

const WIDGETS = [
  {
    id: "uptime-overview",
    name: "Uptime Overview",
    description: "Summary of all service uptime percentages",
    category: "monitoring",
    minW: 6,
    minH: 3,
    defaultW: 12,
    defaultH: 4,
    proOnly: false,
  },
  {
    id: "service-grid",
    name: "Service Grid",
    description: "Grid view of all services with status indicators",
    category: "monitoring",
    minW: 4,
    minH: 4,
    defaultW: 8,
    defaultH: 6,
    proOnly: false,
  },
  {
    id: "recent-logs",
    name: "Recent Logs",
    description: "Live feed of recent log entries",
    category: "logs",
    minW: 3,
    minH: 4,
    defaultW: 4,
    defaultH: 6,
    proOnly: false,
  },
  {
    id: "response-time-chart",
    name: "Response Time Chart",
    description: "Response time trends over time",
    category: "charts",
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    proOnly: false,
  },
  {
    id: "alerts-feed",
    name: "Alerts Feed",
    description: "Recent alert events",
    category: "alerts",
    minW: 3,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    proOnly: false,
  },
  {
    id: "node-status",
    name: "Node Status",
    description: "Hardware node status overview",
    category: "monitoring",
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    proOnly: true,
  },
  {
    id: "metrics-explorer",
    name: "Metrics Explorer",
    description: "Custom metric visualization with configurable queries",
    category: "charts",
    minW: 4,
    minH: 4,
    defaultW: 6,
    defaultH: 5,
    proOnly: true,
  },
  {
    id: "error-rate-chart",
    name: "Error Rate Chart",
    description: "Error rate trends and anomaly detection",
    category: "charts",
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    proOnly: true,
  },
  {
    id: "log-volume",
    name: "Log Volume",
    description: "Log ingestion volume over time",
    category: "logs",
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    proOnly: true,
  },
  {
    id: "service-map",
    name: "Service Map",
    description: "Visual service dependency map",
    category: "monitoring",
    minW: 6,
    minH: 5,
    defaultW: 12,
    defaultH: 6,
    proOnly: true,
  },
];

export async function GET() {
  try {
    await requireAuth();

    const plan = await getLicensePlan();
    const isPro = plan === "PRO" || plan === "LIFETIME";

    const widgets = WIDGETS.map((widget) => ({
      ...widget,
      available: isPro || !widget.proOnly,
    }));

    return NextResponse.json({ data: widgets });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
