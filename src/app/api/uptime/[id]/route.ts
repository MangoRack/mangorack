import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";

function getRangeDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "24h":
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const service = await prisma.service.findUnique({
      where: { id: params.id, isActive: true },
      select: { id: true, name: true, currentStatus: true },
    });
    if (!service) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    const range = request.nextUrl.searchParams.get("range") || "24h";
    const since = getRangeDate(range);

    const checks = await prisma.uptimeCheck.findMany({
      where: {
        serviceId: params.id,
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: "asc" },
    });

    const checksTotal = checks.length;
    const checksUp = checks.filter(
      (c) => c.status === "UP" || c.status === "DEGRADED"
    ).length;
    const uptimePercent =
      checksTotal > 0
        ? Math.round((checksUp / checksTotal) * 10000) / 100
        : 100;

    const responseTimes = checks
      .map((c) => c.responseTime)
      .filter((rt): rt is number => rt !== null);
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          )
        : 0;

    // Build timeline data points (group by hour for ranges > 24h, by 5min for 24h)
    const intervalMs = range === "24h" ? 5 * 60 * 1000 : 60 * 60 * 1000;
    const timeline: Array<{
      timestamp: string;
      status: string;
      avgResponseTime: number;
      checks: number;
    }> = [];

    const buckets = new Map<
      number,
      { statuses: string[]; responseTimes: number[] }
    >();

    for (const check of checks) {
      const bucketTime =
        Math.floor(check.checkedAt.getTime() / intervalMs) * intervalMs;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, { statuses: [], responseTimes: [] });
      }
      const bucket = buckets.get(bucketTime)!;
      bucket.statuses.push(check.status);
      if (check.responseTime !== null) {
        bucket.responseTimes.push(check.responseTime);
      }
    }

    for (const [ts, bucket] of Array.from(buckets.entries()).sort(
      (a, b) => a[0] - b[0]
    )) {
      const downCount = bucket.statuses.filter((s) => s === "DOWN").length;
      const avgRt =
        bucket.responseTimes.length > 0
          ? Math.round(
              bucket.responseTimes.reduce((a, b) => a + b, 0) /
                bucket.responseTimes.length
            )
          : 0;

      let status = "UP";
      if (downCount === bucket.statuses.length) status = "DOWN";
      else if (downCount > 0) status = "DEGRADED";

      timeline.push({
        timestamp: new Date(ts).toISOString(),
        status,
        avgResponseTime: avgRt,
        checks: bucket.statuses.length,
      });
    }

    return NextResponse.json({
      data: {
        serviceId: service.id,
        serviceName: service.name,
        currentStatus: service.currentStatus,
        uptimePercent,
        avgResponseTime,
        checksTotal,
        checksUp,
        timeline,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
