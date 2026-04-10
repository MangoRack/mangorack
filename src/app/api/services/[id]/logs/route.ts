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
    const level = searchParams.get("level");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { serviceId: params.id };

    if (level) {
      where.level = level;
    }
    if (from || to) {
      where.timestamp = {};
      if (from) (where.timestamp as Record<string, unknown>).gte = new Date(from);
      if (to) (where.timestamp as Record<string, unknown>).lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.logEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      meta: { total, page, limit },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
