import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { ApiError, errorResponse } from "@/lib/auth-helpers";
import { getLicensePlan } from "@/lib/limits";

const metricSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number(),
  unit: z.string().max(50).optional(),
  ts: z.string().datetime().optional(),
});

const ingestSchema = z.object({
  serviceId: z.string().cuid(),
  metrics: z.array(metricSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    // Auth via X-Service-Token
    const token = request.headers.get("X-Service-Token");
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "X-Service-Token header required");
    }

    // Validate token (any valid service ID)
    const tokenService = await prisma.service.findUnique({
      where: { id: token, isActive: true },
      select: { id: true },
    });
    if (!tokenService) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid service token");
    }

    // Rate limiting for free tier
    const plan = await getLicensePlan();
    if (plan === "FREE") {
      const rateLimitKey = `ratelimit:metrics:${tokenService.id}`;
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
        await redis.expire(rateLimitKey, 60); // 1 minute window
      }
      if (count > 100) {
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Free plan: max 100 metric ingestions per minute. Upgrade for higher limits.",
          true
        );
      }
    }

    const body = await request.json();
    const data = ingestSchema.parse(body);

    // Enforce token matches target service (prevent cross-service writes)
    if (tokenService.id !== data.serviceId) {
      throw new ApiError(403, "FORBIDDEN", "Service token does not match target serviceId");
    }

    // Group metrics by name
    const metricsByName = new Map<
      string,
      Array<{ value: number; unit?: string; ts?: string }>
    >();
    for (const metric of data.metrics) {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    }

    let totalPoints = 0;

    for (const [name, points] of metricsByName) {
      // Upsert series
      let series = await prisma.metricSeries.findUnique({
        where: {
          serviceId_name: {
            serviceId: data.serviceId,
            name,
          },
        },
      });

      if (!series) {
        series = await prisma.metricSeries.create({
          data: {
            serviceId: data.serviceId,
            name,
            unit: points[0].unit,
          },
        });
      }

      // Create points
      const created = await prisma.metricPoint.createMany({
        data: points.map((p) => ({
          seriesId: series!.id,
          value: p.value,
          ts: p.ts ? new Date(p.ts) : new Date(),
        })),
      });

      totalPoints += created.count;
    }

    return NextResponse.json(
      { data: { ingested: totalPoints } },
      { status: 201 }
    );
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
