import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  url: z.string().url().nullable().optional(),
  type: z.enum(["HTTP", "HTTPS", "TCP", "PING", "DNS", "CUSTOM"]).optional(),
  category: z.string().max(50).nullable().optional(),
  tags: z.array(z.string()).optional(),
  nodeId: z.string().cuid().nullable().optional(),
  port: z.number().int().min(1).max(65535).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  isPinned: z.boolean().optional(),
  pingEnabled: z.boolean().optional(),
  pingInterval: z.number().int().min(10).max(3600).optional(),
  pingTimeout: z.number().int().min(1).max(60).optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  pingMethod: z.enum(["GET", "POST", "PUT", "HEAD", "OPTIONS"]).optional(),
  pingHeaders: z.record(z.string()).nullable().optional(),
  pingBody: z.string().nullable().optional(),
  currentStatus: z.enum(["UP", "DOWN", "DEGRADED", "PAUSED", "UNKNOWN"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const service = await prisma.service.findUnique({
      where: { id: params.id, isActive: true },
      include: {
        node: { select: { id: true, name: true, type: true } },
        uptimeChecks: {
          orderBy: { checkedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!service) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    return NextResponse.json({ data: service });
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

    const existing = await prisma.service.findUnique({
      where: { id: params.id, isActive: true },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    const body = await request.json();
    const data = updateServiceSchema.parse(body);

    if (data.nodeId) {
      const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
      if (!node) {
        throw new ApiError(400, "INVALID_NODE", "Node not found");
      }
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...data,
        pingHeaders: data.pingHeaders as any,
      } as any,
      include: {
        node: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({ data: service });
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

    const existing = await prisma.service.findUnique({
      where: { id: params.id, isActive: true },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    await prisma.service.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
