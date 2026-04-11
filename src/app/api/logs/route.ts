import { NextRequest, NextResponse } from "next/server";
import { Prisma, LogLevel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level");
    const serviceId = searchParams.get("serviceId");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.LogEntryWhereInput = {};

    if (level) {
      where.level = level as LogLevel;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (search) {
      where.message = { contains: search, mode: "insensitive" };
    }

    if (from || to) {
      const timestamp: Record<string, Date> = {};
      if (from) timestamp.gte = new Date(from);
      if (to) timestamp.lte = new Date(to);
      where.timestamp = timestamp;
    }

    const [data, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip,
      }),
      prisma.logEntry.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
