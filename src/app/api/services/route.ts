import { NextRequest, NextResponse } from "next/server";
import { Prisma, ServiceStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

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

    if (!json.name || !json.type) {
      throw new ApiError(400, "VALIDATION_ERROR", "Fields 'name' and 'type' are required");
    }

    const service = await prisma.service.create({
      data: {
        name: json.name,
        type: json.type,
        description: json.description,
        url: json.url,
        category: json.category,
        tags: json.tags ?? [],
        nodeId: json.nodeId,
        port: json.port,
        icon: json.icon,
        color: json.color,
        isActive: json.isActive ?? true,
        isPinned: json.isPinned ?? false,
        pingEnabled: json.pingEnabled ?? true,
        pingInterval: json.pingInterval ?? 60,
        pingTimeout: json.pingTimeout ?? 10,
        expectedStatus: json.expectedStatus ?? 200,
        pingMethod: json.pingMethod ?? "GET",
        pingHeaders: json.pingHeaders,
        pingBody: json.pingBody,
      },
      include: { node: true },
    });

    return NextResponse.json({ data: service }, { status: 201 });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
