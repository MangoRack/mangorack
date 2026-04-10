import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = request.nextUrl;
    const level = searchParams.get("level");
    const serviceId = searchParams.get("serviceId");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const cursor = searchParams.get("cursor");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const where: Record<string, unknown> = {};

    if (level) {
      where.level = level;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (search) {
      where.message = { contains: search, mode: "insensitive" };
    }
    if (from || to) {
      where.timestamp = {};
      if (from) (where.timestamp as Record<string, unknown>).gte = new Date(from);
      if (to) (where.timestamp as Record<string, unknown>).lte = new Date(to);
    }

    // Cursor-based pagination
    if (cursor) {
      const logs = await prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: 1,
        cursor: { id: cursor },
        include: {
          service: { select: { id: true, name: true } },
        },
      });

      const nextCursor = logs.length === limit ? logs[logs.length - 1].id : null;

      return NextResponse.json({
        data: logs,
        meta: { limit, cursor: nextCursor },
      });
    }

    // Offset-based pagination
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          service: { select: { id: true, name: true } },
        },
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
