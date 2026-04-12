import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

const updateAlertSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["SERVICE_DOWN", "SERVICE_SLOW", "HIGH_ERROR_RATE", "LOG_PATTERN", "METRIC_THRESHOLD", "CUSTOM"]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  condition: z.object({
    operator: z.enum(["gt", "lt", "eq", "gte", "lte", "contains", "matches"]).optional(),
    value: z.union([z.number(), z.string()]).optional(),
    threshold: z.number().optional(),
    responseTimeMs: z.number().optional(),
    errorRate: z.number().optional(),
    pattern: z.string().max(200).optional(),
    metric: z.string().optional(),
    consecutiveFailures: z.number().int().min(1).optional(),
  }),
  serviceId: z.string().optional(),
  isEnabled: z.boolean().optional(),
  cooldownMins: z.number().int().min(1).optional(),
}).partial();

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
    const parsed = updateAlertSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: parsed.data,
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
