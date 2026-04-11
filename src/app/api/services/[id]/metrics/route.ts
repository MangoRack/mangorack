import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const data = await prisma.metricSeries.findMany({
      where: { serviceId: params.id },
      include: {
        points: {
          orderBy: { ts: "desc" },
          take: 96,
        },
      },
    });

    return NextResponse.json({ data });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
