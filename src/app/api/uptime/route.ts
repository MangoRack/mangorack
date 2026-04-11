import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAuth();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        currentStatus: true,
        uptimeChecks: {
          where: { checkedAt: { gte: since30d } },
          orderBy: { checkedAt: "desc" },
          select: {
            status: true,
            responseTime: true,
            checkedAt: true,
            error: true,
          },
        },
      },
    });

    const summaries = services.map((service) => {
      const checks = service.uptimeChecks;

      const calcUptime = (since: Date) => {
        const filtered = checks.filter((c) => c.checkedAt >= since);
        if (filtered.length === 0) return 100;
        const up = filtered.filter((c) => c.status === "UP" || c.status === "DEGRADED").length;
        return parseFloat(((up / filtered.length) * 100).toFixed(2));
      };

      const responseTimes = checks
        .filter((c) => c.responseTime !== null)
        .map((c) => c.responseTime as number);
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      const checksTotal = checks.length;
      const checksUp = checks.filter((c) => c.status === "UP" || c.status === "DEGRADED").length;

      return {
        serviceId: service.id,
        serviceName: service.name,
        currentStatus: service.currentStatus,
        avgResponseTime,
        checksTotal,
        checksUp,
        uptimeRanges: {
          "24h": calcUptime(since24h),
          "7d": calcUptime(since7d),
          "30d": calcUptime(since30d),
        },
        uptimePercent: calcUptime(since24h),
      };
    });

    // Build incidents from checks where status was DOWN or DEGRADED
    const incidents: Array<{
      serviceId: string;
      serviceName: string;
      status: string;
      startedAt: Date;
      resolvedAt: Date | null;
      duration: number | null;
      error: string | null;
    }> = [];

    for (const service of services) {
      const downChecks = service.uptimeChecks.filter(
        (c) => c.status === "DOWN" || c.status === "DEGRADED"
      );
      for (const check of downChecks.slice(0, 5)) {
        incidents.push({
          serviceId: service.id,
          serviceName: service.name,
          status: check.status,
          startedAt: check.checkedAt,
          resolvedAt: null,
          duration: null,
          error: check.error,
        });
      }
    }

    // Sort incidents by time, take most recent 10
    incidents.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    const upCount = services.filter((s) => s.currentStatus === "UP").length;
    const totalCount = services.length;
    const overallStatus =
      totalCount === 0
        ? "operational"
        : upCount === totalCount
          ? "operational"
          : upCount >= totalCount - 1
            ? "partial"
            : "major";

    const avgUptime =
      summaries.length > 0
        ? parseFloat(
            (summaries.reduce((a, s) => a + s.uptimePercent, 0) / summaries.length).toFixed(2)
          )
        : 100;

    return NextResponse.json({
      data: {
        summaries,
        incidents: incidents.slice(0, 10),
        overall: {
          status: overallStatus,
          uptimePercent: avgUptime,
        },
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
