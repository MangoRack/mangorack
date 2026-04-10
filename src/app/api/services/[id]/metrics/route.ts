import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const service = await prisma.service.findUnique({
      where: { id: params.id, isActive: true },
      select: { id: true },
    });
    if (!service) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const name = searchParams.get("name");

    const seriesWhere: Record<string, unknown> = { serviceId: params.id };
    if (name) {
      seriesWhere.name = name;
    }

    const pointsWhere: Record<string, unknown> = {};
    if (from || to) {
      pointsWhere.ts = {};
      if (from) (pointsWhere.ts as Record<string, unknown>).gte = new Date(from);
      if (to) (pointsWhere.ts as Record<string, unknown>).lte = new Date(to);
    }

    const series = await prisma.metricSeries.findMany({
      where: seriesWhere,
      include: {
        points: {
          where: pointsWhere,
          orderBy: { ts: "asc" },
          take: 1000,
        },
      },
    });

    return NextResponse.json({ data: series });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
