import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where = { serviceId: params.id };

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
