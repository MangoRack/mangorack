import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";
import { checkLimits, getLicensePlan } from "@/lib/limits";

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
  type: z.enum(["HTTP", "HTTPS", "TCP", "PING", "DNS", "CUSTOM"]).default("HTTP"),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  nodeId: z.string().cuid().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  isPinned: z.boolean().default(false),
  pingEnabled: z.boolean().default(true),
  pingInterval: z.number().int().min(10).max(3600).default(60),
  pingTimeout: z.number().int().min(1).max(60).default(10),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  pingMethod: z.enum(["GET", "POST", "PUT", "HEAD", "OPTIONS"]).default("GET"),
  pingHeaders: z.record(z.string()).optional(),
  pingBody: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const nodeId = searchParams.get("nodeId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (status) {
      where.currentStatus = status;
    }
    if (tag) {
      where.tags = { has: tag };
    }
    if (nodeId) {
      where.nodeId = nodeId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          node: { select: { id: true, name: true, type: true } },
        },
        orderBy: [{ isPinned: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      data: { services, total, page, limit },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = createServiceSchema.parse(body);

    // Check free tier limit
    const plan = await getLicensePlan();
    if (plan === "FREE") {
      const activeServices = await prisma.service.count({
        where: { isActive: true },
      });
      const limit = checkLimits(plan, "services");
      if (activeServices >= limit) {
        throw new ApiError(
          403,
          "LIMIT_REACHED",
          `Free plan allows up to ${limit} services. Upgrade to PRO for unlimited.`,
          true
        );
      }
    }

    // Validate nodeId if provided
    if (data.nodeId) {
      const node = await prisma.node.findUnique({
        where: { id: data.nodeId },
      });
      if (!node) {
        throw new ApiError(400, "INVALID_NODE", "Node not found");
      }
    }

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        type: data.type,
        category: data.category,
        tags: data.tags,
        nodeId: data.nodeId,
        port: data.port,
        icon: data.icon,
        color: data.color,
        isPinned: data.isPinned,
        pingEnabled: data.pingEnabled,
        pingInterval: data.pingInterval,
        pingTimeout: data.pingTimeout,
        expectedStatus: data.expectedStatus,
        pingMethod: data.pingMethod,
        pingHeaders: data.pingHeaders ?? undefined,
        pingBody: data.pingBody,
      },
      include: {
        node: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({ data: service }, { status: 201 });
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
