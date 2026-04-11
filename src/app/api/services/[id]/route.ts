import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";
import { isSafeUrl } from "@/lib/url-safety";

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

    if (json.url !== undefined && json.url && !isSafeUrl(json.url)) {
      throw new ApiError(400, "VALIDATION_ERROR", "URL blocked by security policy");
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(json.name !== undefined && { name: json.name }),
        ...(json.description !== undefined && { description: json.description }),
        ...(json.url !== undefined && { url: json.url }),
        ...(json.type !== undefined && { type: json.type }),
        ...(json.category !== undefined && { category: json.category }),
        ...(json.tags !== undefined && { tags: json.tags }),
        ...(json.nodeId !== undefined && { nodeId: json.nodeId }),
        ...(json.port !== undefined && { port: json.port }),
        ...(json.icon !== undefined && { icon: json.icon }),
        ...(json.color !== undefined && { color: json.color }),
        ...(json.isActive !== undefined && { isActive: json.isActive }),
        ...(json.isPinned !== undefined && { isPinned: json.isPinned }),
        ...(json.pingEnabled !== undefined && { pingEnabled: json.pingEnabled }),
        ...(json.pingInterval !== undefined && { pingInterval: json.pingInterval }),
        ...(json.pingTimeout !== undefined && { pingTimeout: json.pingTimeout }),
        ...(json.expectedStatus !== undefined && { expectedStatus: json.expectedStatus }),
        ...(json.pingMethod !== undefined && { pingMethod: json.pingMethod }),
        ...(json.pingHeaders !== undefined && { pingHeaders: json.pingHeaders }),
        ...(json.pingBody !== undefined && { pingBody: json.pingBody }),
        ...(json.currentStatus !== undefined && { currentStatus: json.currentStatus }),
      },
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
