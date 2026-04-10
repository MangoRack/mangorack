import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const range = request.nextUrl.searchParams.get("range") || "24h";
    const now = new Date();
    let since: Date;
    switch (range) {
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Gather all analytics data in parallel
    const [
      services,
      totalLogs,
      errorLogs,
      uptimeChecks,
    ] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, name: true, currentStatus: true },
      }),
      prisma.logEntry.count({
        where: { timestamp: { gte: since } },
      }),
      prisma.logEntry.count({
        where: {
          timestamp: { gte: since },
          level: { in: ["ERROR", "FATAL"] },
        },
      }),
      prisma.uptimeCheck.findMany({
        where: { checkedAt: { gte: since } },
        select: {
          serviceId: true,
          status: true,
          responseTime: true,
          checkedAt: true,
        },
      }),
    ]);

    const totalServices = services.length;
    const servicesUp = services.filter((s) => s.currentStatus === "UP").length;
    const servicesDown = services.filter(
      (s) => s.currentStatus === "DOWN"
    ).length;
    const errorRate =
      totalLogs > 0
        ? Math.round((errorLogs / totalLogs) * 10000) / 100
        : 0;

    // Per-service uptime and response time
    const serviceChecks = new Map<
      string,
      { up: number; total: number; responseTimes: number[]; name: string; errors: number }
    >();

    for (const service of services) {
      serviceChecks.set(service.id, {
        up: 0,
        total: 0,
        responseTimes: [],
        name: service.name,
        errors: 0,
      });
    }

    for (const check of uptimeChecks) {
      const entry = serviceChecks.get(check.serviceId);
      if (!entry) continue;
      entry.total++;
      if (check.status === "UP" || check.status === "DEGRADED") {
        entry.up++;
      }
      if (check.status === "DOWN") {
        entry.errors++;
      }
      if (check.responseTime !== null) {
        entry.responseTimes.push(check.responseTime);
      }
    }

    // Calculate aggregates
    let avgUptime = 100;
    const uptimes: number[] = [];
    let allResponseTimes: number[] = [];
    let slowestService = { name: "", avgResponseTime: 0 };
    let mostErrors = { name: "", errorCount: 0 };

    for (const [, entry] of serviceChecks) {
      if (entry.total > 0) {
        uptimes.push((entry.up / entry.total) * 100);
      }
      allResponseTimes = allResponseTimes.concat(entry.responseTimes);

      const avgRt =
        entry.responseTimes.length > 0
          ? entry.responseTimes.reduce((a, b) => a + b, 0) /
            entry.responseTimes.length
          : 0;
      if (avgRt > slowestService.avgResponseTime) {
        slowestService = { name: entry.name, avgResponseTime: Math.round(avgRt) };
      }
      if (entry.errors > mostErrors.errorCount) {
        mostErrors = { name: entry.name, errorCount: entry.errors };
      }
    }

    if (uptimes.length > 0) {
      avgUptime =
        Math.round(
          (uptimes.reduce((a, b) => a + b, 0) / uptimes.length) * 100
        ) / 100;
    }

    const avgResponseTime =
      allResponseTimes.length > 0
        ? Math.round(
            allResponseTimes.reduce((a, b) => a + b, 0) /
              allResponseTimes.length
          )
        : 0;

    // Build trend data (hourly buckets)
    const bucketMs = 60 * 60 * 1000; // 1 hour
    const uptimeTrend: Array<{ timestamp: string; value: number }> = [];
    const responseTimeTrend: Array<{ timestamp: string; value: number }> = [];

    const checkBuckets = new Map<number, { up: number; total: number; rts: number[] }>();

    for (const check of uptimeChecks) {
      const bucket = Math.floor(check.checkedAt.getTime() / bucketMs) * bucketMs;
      if (!checkBuckets.has(bucket)) {
        checkBuckets.set(bucket, { up: 0, total: 0, rts: [] });
      }
      const b = checkBuckets.get(bucket)!;
      b.total++;
      if (check.status === "UP" || check.status === "DEGRADED") b.up++;
      if (check.responseTime !== null) b.rts.push(check.responseTime);
    }

    for (const [ts, b] of Array.from(checkBuckets.entries()).sort(
      (a, b) => a[0] - b[0]
    )) {
      uptimeTrend.push({
        timestamp: new Date(ts).toISOString(),
        value: b.total > 0 ? Math.round((b.up / b.total) * 10000) / 100 : 100,
      });
      responseTimeTrend.push({
        timestamp: new Date(ts).toISOString(),
        value:
          b.rts.length > 0
            ? Math.round(b.rts.reduce((a, c) => a + c, 0) / b.rts.length)
            : 0,
      });
    }

    // Log volume trend
    const logEntries = await prisma.logEntry.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    const logBuckets = new Map<number, number>();
    for (const entry of logEntries) {
      const bucket =
        Math.floor(entry.timestamp.getTime() / bucketMs) * bucketMs;
      logBuckets.set(bucket, (logBuckets.get(bucket) || 0) + 1);
    }

    const logVolumeTrend = Array.from(logBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, count]) => ({
        timestamp: new Date(ts).toISOString(),
        value: count,
      }));

    return NextResponse.json({
      data: {
        totalServices,
        servicesUp,
        servicesDown,
        avgUptime,
        totalLogs,
        errorRate,
        avgResponseTime,
        slowestService: slowestService.name ? slowestService : null,
        mostErrors: mostErrors.name ? mostErrors : null,
        uptimeTrend,
        responseTimeTrend,
        logVolumeTrend,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
