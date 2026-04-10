import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

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

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const range = request.nextUrl.searchParams.get("range") || "24h";
    const since = getRangeDate(range);

    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, currentStatus: true },
    });

    const summaries = await Promise.all(
      services.map(async (service) => {
        const checks = await prisma.uptimeCheck.findMany({
          where: {
            serviceId: service.id,
            checkedAt: { gte: since },
          },
          select: { status: true, responseTime: true },
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
                responseTimes.reduce((a, b) => a + b, 0) /
                  responseTimes.length
              )
            : 0;

        return {
          serviceId: service.id,
          serviceName: service.name,
          currentStatus: service.currentStatus,
          uptimePercent,
          avgResponseTime,
          checksTotal,
          checksUp,
        };
      })
    );

    return NextResponse.json({ data: summaries });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
