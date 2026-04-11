import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAuth();

    const data = await prisma.alert.findMany({
      include: {
        service: {
          select: { id: true, name: true },
        },
        events: {
          take: 5,
          orderBy: { firedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const json = await request.json();

    if (!json.name || !json.type || !json.condition) {
      throw new ApiError(400, "VALIDATION_ERROR", "Fields 'name', 'type', and 'condition' are required");
    }

    const alert = await prisma.alert.create({
      data: {
        name: json.name,
        type: json.type,
        condition: json.condition,
        serviceId: json.serviceId,
        severity: json.severity ?? "WARNING",
        isEnabled: json.isEnabled ?? true,
        cooldownMins: json.cooldownMins ?? 15,
      },
      include: {
        service: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: alert }, { status: 201 });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
