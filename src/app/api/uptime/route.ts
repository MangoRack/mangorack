import { NextResponse } from "next/server";
import { generateUptimeSummary, mockServices } from "@/lib/mock-data";

export async function GET() {
  const raw = generateUptimeSummary();

  const upCount = mockServices.filter(s => s.currentStatus === "UP").length;
  const totalCount = mockServices.length;
  const overallStatus = upCount === totalCount ? "operational" : upCount >= totalCount - 1 ? "partial" : "major";
  const avgUptime = raw.services.reduce((a, s) => a + s.uptimePercent, 0) / raw.services.length;

  return NextResponse.json({
    data: {
      summaries: raw.services.map(s => ({
        ...s,
        uptimeRanges: { "24h": s.uptimePercent, "7d": s.uptimePercent - 0.1, "30d": s.uptimePercent - 0.3 },
      })),
      incidents: [
        {
          serviceId: "svc-6",
          serviceName: "Plex Media Server",
          status: "DOWN",
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          resolvedAt: null,
          duration: null,
          error: "ECONNREFUSED",
        },
        {
          serviceId: "svc-3",
          serviceName: "Grafana",
          status: "DEGRADED",
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          resolvedAt: new Date(Date.now() - 3600000).toISOString(),
          duration: 3600000,
          error: "HTTP 503",
        },
        {
          serviceId: "svc-6",
          serviceName: "Plex Media Server",
          status: "DOWN",
          startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000 * 3 + 600000).toISOString(),
          duration: 600000,
          error: "Connection timeout",
        },
      ],
      overall: {
        status: overallStatus,
        uptimePercent: avgUptime,
      },
    },
  });
}
