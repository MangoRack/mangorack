import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, ServiceStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";
import { isSafeUrl } from "@/lib/url-safety";

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["HTTP", "HTTPS", "TCP", "PING", "DNS"]),
  description: z.string().max(1000).optional(),
  url: z.string().max(2048).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  nodeId: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  icon: z.string().max(255).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  pingEnabled: z.boolean().optional(),
  pingInterval: z.number().int().min(10).optional(),
  pingTimeout: z.number().int().min(1).optional(),
  expectedStatus: z.number().int().optional(),
  pingMethod: z.string().optional(),
  pingHeaders: z.record(z.string()).optional().nullable(),
  pingBody: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const nodeId = searchParams.get("nodeId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.currentStatus = status as ServiceStatus;
    }

    if (nodeId) {
      where.nodeId = nodeId;
    }

    const [data, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: { node: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const json = await request.json();
    const data = createServiceSchema.parse(json);

    if (data.url && !isSafeUrl(data.url)) {
      throw new ApiError(400, "VALIDATION_ERROR", "URL blocked by security policy");
    }

    const service = await prisma.service.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        url: data.url,
        category: data.category,
        tags: data.tags ?? [],
        nodeId: data.nodeId,
        port: data.port,
        icon: data.icon,
        color: data.color,
        isActive: data.isActive ?? true,
        isPinned: data.isPinned ?? false,
        pingEnabled: data.pingEnabled ?? true,
        pingInterval: data.pingInterval ?? 60,
        pingTimeout: data.pingTimeout ?? 10,
        expectedStatus: data.expectedStatus ?? 200,
        pingMethod: data.pingMethod ?? "GET",
        pingHeaders: data.pingHeaders,
        pingBody: data.pingBody,
      },
      include: { node: true },
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
