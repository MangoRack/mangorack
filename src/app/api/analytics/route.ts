import { NextResponse } from "next/server";
import { generateAnalytics, mockServices } from "@/lib/mock-data";

export async function GET() {
  const raw = generateAnalytics();

  const data = {
    summary: {
      uptimePercent: raw.avgUptime,
      uptimeTrend: 0.3,
      totalChecks: raw.totalChecks,
      avgResponseTime: raw.avgResponseTime,
      totalLogs: raw.totalLogs,
      errorRate: raw.errorRate,
      errorRateTrend: -0.5,
      activeAlerts: raw.activeAlerts,
    },
    uptimeTrend: raw.uptimeTrend,
    responseTimeDistribution: mockServices.slice(0, 5).map(s => ({
      service: s.name,
      p50: Math.floor(s._responseTime * 0.8),
      p95: Math.floor(s._responseTime * 2.5),
      p99: Math.floor(s._responseTime * 4),
    })),
    logVolume: raw.logVolumeTrend,
    errorRateOverTime: raw.uptimeTrend.map(t => ({
      time: t.time,
      rate: Math.max(0, 100 - t.uptime) * 0.8,
    })),
    slowestServices: [
      { service: "Grafana", avgResponseTime: 892 },
      { service: "Nextcloud", avgResponseTime: 245 },
      { service: "Home Assistant", avgResponseTime: 67 },
      { service: "Nginx Proxy", avgResponseTime: 12 },
      { service: "Wireguard VPN", avgResponseTime: 8 },
    ],
    mostErrors: [
      { service: "Plex Media Server", errorCount: 142 },
      { service: "Grafana", errorCount: 38 },
      { service: "Nextcloud", errorCount: 12 },
      { service: "Home Assistant", errorCount: 5 },
      { service: "Nginx Proxy", errorCount: 2 },
    ],
    uptimeHeatmap: Array.from({ length: 7 * 24 }, (_, i) => ({
      day: Math.floor(i / 24),
      hour: i % 24,
      value: 95 + Math.random() * 5,
    })),
    responseTimeHeatmap: Array.from({ length: 7 * 24 }, (_, i) => ({
      day: Math.floor(i / 24),
      hour: i % 24,
      value: Math.floor(50 + Math.random() * 300),
    })),
  };

  return NextResponse.json({ data });
}
