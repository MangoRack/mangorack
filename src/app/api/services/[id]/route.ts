import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";
import { isSafeUrl } from "@/lib/url-safety";

const updateServiceSchema = z.object({
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
  currentStatus: z.enum(["UP", "DOWN", "DEGRADED", "UNKNOWN", "MAINTENANCE"]).optional(),
}).partial();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        node: true,
        uptimeChecks: {
          take: 10,
          orderBy: { checkedAt: "desc" },
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

    const existing = await prisma.service.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    const json = await request.json();
    const parsed = updateServiceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.url && !isSafeUrl(data.url, { allowPrivateIPs: true })) {
      throw new ApiError(400, "VALIDATION_ERROR", "URL blocked by security policy");
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: data as Prisma.ServiceUpdateInput,
      include: { node: true },
    });

    return NextResponse.json({ data: service });
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

    const existing = await prisma.service.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Service not found");
    }

    await prisma.service.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
