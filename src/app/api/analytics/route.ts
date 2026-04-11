import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const range = request.nextUrl.searchParams.get("range") || "24h";

    let sinceMs: number;
    switch (range) {
      case "7d":
        sinceMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        sinceMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "24h":
      default:
        sinceMs = 24 * 60 * 60 * 1000;
        break;
    }

    const since = new Date(Date.now() - sinceMs);

    // Run all aggregate queries in parallel
    const [
      totalChecks,
      checksUp,
      totalLogs,
      errorLogs,
      activeAlerts,
      logsByLevel,
      services,
      recentChecks,
    ] = await Promise.all([
      prisma.uptimeCheck.count({ where: { checkedAt: { gte: since } } }),
      prisma.uptimeCheck.count({
        where: { checkedAt: { gte: since }, status: { in: ["UP", "DEGRADED"] } },
      }),
      prisma.logEntry.count({ where: { timestamp: { gte: since } } }),
      prisma.logEntry.count({
        where: { timestamp: { gte: since }, level: { in: ["ERROR", "FATAL"] } },
      }),
      prisma.alert.count({ where: { isEnabled: true } }),
      prisma.logEntry.groupBy({
        by: ["level"],
        where: { timestamp: { gte: since } },
        _count: { id: true },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          uptimeChecks: {
            where: { checkedAt: { gte: since } },
            select: { responseTime: true, status: true },
          },
        },
      }),
      prisma.uptimeCheck.findMany({
        where: { checkedAt: { gte: since } },
        select: { checkedAt: true, status: true, responseTime: true },
        orderBy: { checkedAt: "asc" },
      }),
    ]);

    const uptimePercent =
      totalChecks > 0
        ? parseFloat(((checksUp / totalChecks) * 100).toFixed(2))
        : 100;

    const allResponseTimes = recentChecks
      .filter((c) => c.responseTime !== null)
      .map((c) => c.responseTime as number);
    const avgResponseTime =
      allResponseTimes.length > 0
        ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
        : 0;

    const errorRate =
      totalLogs > 0
        ? parseFloat(((errorLogs / totalLogs) * 100).toFixed(2))
        : 0;

    // Per-service response time stats
    const responseTimeDistribution = services
      .map((s) => {
        const rts = s.uptimeChecks
          .filter((c) => c.responseTime !== null)
          .map((c) => c.responseTime as number)
          .sort((a, b) => a - b);
        if (rts.length === 0) return null;
        return {
          service: s.name,
          p50: rts[Math.floor(rts.length * 0.5)] ?? 0,
          p95: rts[Math.floor(rts.length * 0.95)] ?? 0,
          p99: rts[Math.floor(rts.length * 0.99)] ?? 0,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    // Slowest services by avg response time
    const slowestServices = services
      .map((s) => {
        const rts = s.uptimeChecks
          .filter((c) => c.responseTime !== null)
          .map((c) => c.responseTime as number);
        const avg =
          rts.length > 0
            ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
            : 0;
        return { service: s.name, avgResponseTime: avg };
      })
      .filter((s) => s.avgResponseTime > 0)
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 5);

    // Most errors per service
    const mostErrors = services
      .map((s) => {
        const errorCount = s.uptimeChecks.filter(
          (c) => c.status === "DOWN"
        ).length;
        return { service: s.name, errorCount };
      })
      .filter((s) => s.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);

    // Build uptime trend (bucket checks by hour)
    const bucketSize = range === "24h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const buckets = new Map<number, { up: number; total: number }>();

    for (const check of recentChecks) {
      const bucket = Math.floor(check.checkedAt.getTime() / bucketSize) * bucketSize;
      const entry = buckets.get(bucket) || { up: 0, total: 0 };
      entry.total++;
      if (check.status === "UP" || check.status === "DEGRADED") entry.up++;
      buckets.set(bucket, entry);
    }

    const uptimeTrend = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([time, { up, total }]) => ({
        time: new Date(time).toISOString(),
        uptime: total > 0 ? parseFloat(((up / total) * 100).toFixed(2)) : 100,
      }));

    // Log volume trend
    const logVolume = logsByLevel.map((g) => ({
      level: g.level,
      count: g._count.id,
    }));

    // Error rate over time (reuse uptime trend timestamps)
    const errorRateOverTime = uptimeTrend.map((t) => ({
      time: t.time,
      rate: parseFloat(Math.max(0, 100 - t.uptime).toFixed(2)),
    }));

    // Heatmap: group checks by day-of-week and hour
    const uptimeHeatmap: Array<{ day: number; hour: number; value: number }> = [];
    const heatBuckets = new Map<string, { up: number; total: number }>();

    for (const check of recentChecks) {
      const d = check.checkedAt;
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      const key = `${day}-${hour}`;
      const entry = heatBuckets.get(key) || { up: 0, total: 0 };
      entry.total++;
      if (check.status === "UP" || check.status === "DEGRADED") entry.up++;
      heatBuckets.set(key, entry);
    }

    for (const [key, { up, total }] of heatBuckets.entries()) {
      const [day, hour] = key.split("-").map(Number);
      uptimeHeatmap.push({
        day,
        hour,
        value: total > 0 ? parseFloat(((up / total) * 100).toFixed(2)) : 100,
      });
    }

    // Response time heatmap
    const rtHeatBuckets = new Map<string, number[]>();

    for (const check of recentChecks) {
      if (check.responseTime === null) continue;
      const d = check.checkedAt;
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      const key = `${day}-${hour}`;
      const entry = rtHeatBuckets.get(key) || [];
      entry.push(check.responseTime);
      rtHeatBuckets.set(key, entry);
    }

    const responseTimeHeatmap: Array<{ day: number; hour: number; value: number }> = [];
    for (const [key, rts] of rtHeatBuckets.entries()) {
      const [day, hour] = key.split("-").map(Number);
      responseTimeHeatmap.push({
        day,
        hour,
        value: Math.round(rts.reduce((a, b) => a + b, 0) / rts.length),
      });
    }

    return NextResponse.json({
      data: {
        summary: {
          uptimePercent,
          uptimeTrend: uptimeTrend.length >= 2
            ? parseFloat((uptimeTrend[uptimeTrend.length - 1].uptime - uptimeTrend[0].uptime).toFixed(2))
            : 0,
          totalChecks,
          avgResponseTime,
          totalLogs,
          errorRate,
          errorRateTrend: 0,
          activeAlerts,
        },
        uptimeTrend,
        responseTimeDistribution,
        logVolume,
        errorRateOverTime,
        slowestServices,
        mostErrors,
        uptimeHeatmap,
        responseTimeHeatmap,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
