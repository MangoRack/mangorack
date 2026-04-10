import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";
import { checkLimits, getLicensePlan } from "@/lib/limits";

const createAlertSchema = z.object({
  name: z.string().min(1).max(100),
  serviceId: z.string().cuid().optional(),
  type: z.enum([
    "SERVICE_DOWN",
    "SERVICE_SLOW",
    "HIGH_ERROR_RATE",
    "LOG_PATTERN",
    "METRIC_THRESHOLD",
    "CUSTOM",
  ]),
  condition: z.record(z.unknown()),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("WARNING"),
  isEnabled: z.boolean().default(true),
  cooldownMins: z.number().int().min(1).max(1440).default(15),
});

export async function GET() {
  try {
    await requireAuth();

    const alerts = await prisma.alert.findMany({
      include: {
        service: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: alerts });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = createAlertSchema.parse(body);

    // Check free tier limit
    const plan = await getLicensePlan();
    if (plan === "FREE") {
      const alertCount = await prisma.alert.count();
      const limit = checkLimits(plan, "alerts");
      if (alertCount >= limit) {
        throw new ApiError(
          403,
          "LIMIT_REACHED",
          `Free plan allows up to ${limit} alerts. Upgrade to PRO for unlimited.`,
          true
        );
      }
    }

    // Validate serviceId if provided
    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) {
        throw new ApiError(400, "INVALID_SERVICE", "Service not found");
      }
    }

    const alert = await prisma.alert.create({
      data: {
        name: data.name,
        serviceId: data.serviceId,
        type: data.type,
        condition: data.condition as any,
        severity: data.severity,
        isEnabled: data.isEnabled,
        cooldownMins: data.cooldownMins,
      },
      include: {
        service: { select: { id: true, name: true } },
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
