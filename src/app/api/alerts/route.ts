import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

const createAlertSchema = z.object({
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
});

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
    const data = createAlertSchema.parse(json);

    const alert = await prisma.alert.create({
      data: {
        name: data.name,
        type: data.type,
        condition: data.condition,
        serviceId: data.serviceId,
        severity: data.severity ?? "WARNING",
        isEnabled: data.isEnabled ?? true,
        cooldownMins: data.cooldownMins ?? 15,
      },
      include: {
        service: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: alert }, { status: 201 });
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
