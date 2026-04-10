import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";

const updateAlertSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  serviceId: z.string().cuid().nullable().optional(),
  type: z
    .enum([
      "SERVICE_DOWN",
      "SERVICE_SLOW",
      "HIGH_ERROR_RATE",
      "LOG_PATTERN",
      "METRIC_THRESHOLD",
      "CUSTOM",
    ])
    .optional(),
  condition: z.record(z.unknown()).optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  isEnabled: z.boolean().optional(),
  cooldownMins: z.number().int().min(1).max(1440).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
      include: {
        service: { select: { id: true, name: true } },
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

    const existing = await prisma.alert.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Alert not found");
    }

    const body = await request.json();
    const data = updateAlertSchema.parse(body);

    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) {
        throw new ApiError(400, "INVALID_SERVICE", "Service not found");
      }
    }

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        ...data,
        serviceId: data.serviceId === null ? null : data.serviceId,
        condition: data.condition as any,
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: alert });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }
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

    const existing = await prisma.alert.findUnique({
      where: { id: params.id },
    });
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
