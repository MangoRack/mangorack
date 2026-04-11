import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        events: {
          orderBy: { firedAt: "desc" },
          take: 20,
        },
      },
    });

    if (!alert) {
      throw new ApiError(404, "NOT_FOUND", "Alert not found");
    }

    return NextResponse.json({ data: alert });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const existing = await prisma.alert.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Alert not found");
    }

    const json = await request.json();

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        ...(json.name !== undefined && { name: json.name }),
        ...(json.type !== undefined && { type: json.type }),
        ...(json.condition !== undefined && { condition: json.condition }),
        ...(json.serviceId !== undefined && { serviceId: json.serviceId }),
        ...(json.severity !== undefined && { severity: json.severity }),
        ...(json.isEnabled !== undefined && { isEnabled: json.isEnabled }),
        ...(json.cooldownMins !== undefined && { cooldownMins: json.cooldownMins }),
      },
      include: {
        service: true,
        events: {
          orderBy: { firedAt: "desc" },
          take: 20,
        },
      },
    });

    return NextResponse.json({ data: alert });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const existing = await prisma.alert.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Alert not found");
    }

    await prisma.alert.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
