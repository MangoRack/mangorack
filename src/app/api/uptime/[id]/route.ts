import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        currentStatus: true,
      },
    });

    if (!service) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    const checks = await prisma.uptimeCheck.findMany({
      where: {
        serviceId: params.id,
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: "desc" },
    });

    const checksUp = checks.filter(
      (c) => c.status === "UP" || c.status === "DEGRADED"
    ).length;

    const responseTimes = checks
      .filter((c) => c.responseTime !== null)
      .map((c) => c.responseTime as number);

    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    const uptimePercent =
      checks.length > 0
        ? parseFloat(((checksUp / checks.length) * 100).toFixed(2))
        : 100;

    const timeline = checks.map((c) => ({
      timestamp: c.checkedAt,
      status: c.status,
      avgResponseTime: c.responseTime ?? 0,
      checks: 1,
    }));

    return NextResponse.json({
      data: {
        serviceId: service.id,
        serviceName: service.name,
        currentStatus: service.currentStatus,
        uptimePercent,
        avgResponseTime,
        checksTotal: checks.length,
        checksUp,
        timeline,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
