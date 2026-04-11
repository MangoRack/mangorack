import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import redis from "@/lib/redis";
import { ApiError, errorResponse } from "@/lib/auth-helpers";
import { getLicensePlan } from "@/lib/limits";

const logEntrySchema = z.object({
  level: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]).default("INFO"),
  message: z.string().min(1).max(10000),
  source: z.string().max(255).optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ingestSchema = z.array(logEntrySchema).min(1).max(1000);

export async function POST(request: NextRequest) {
  try {
    // Auth via X-Service-Token (service ID as token)
    const token = request.headers.get("X-Service-Token");
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "X-Service-Token header required");
    }

    // Validate that the service exists
    const service = await prisma.service.findUnique({
      where: { id: token, isActive: true },
      select: { id: true },
    });
    if (!service) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid service token");
    }

    // Rate limiting for free tier
    const plan = await getLicensePlan();
    if (plan === "FREE") {
      const rateLimitKey = `ratelimit:logs:${service.id}`;
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
        await redis.expire(rateLimitKey, 60); // 1 minute window
      }
      if (count > 100) {
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Free plan: max 100 log entries per minute. Upgrade for higher limits.",
          true
        );
      }
    }

    const body = await request.json();
    const entries = ingestSchema.parse(body);

    const created = await prisma.logEntry.createMany({
      data: entries.map((entry) => ({
        serviceId: service.id,
        level: entry.level,
        message: entry.message,
        source: entry.source,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
      })),
    });

    return NextResponse.json(
      { data: { ingested: created.count } },
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
