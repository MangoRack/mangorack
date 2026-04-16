import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

const updateNodeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["PHYSICAL", "VIRTUAL", "CONTAINER", "CLOUD"]),
  description: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  os: z.string().optional().nullable(),
  cpu: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
}).partial();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const node = await prisma.node.findUnique({
      where: { id: params.id },
      include: {
        services: {
          select: { id: true, name: true, currentStatus: true },
        },
      },
    });

    if (!node) {
      throw new ApiError(404, "NOT_FOUND", "Node not found");
    }

    return NextResponse.json({ data: node });
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

    const existing = await prisma.node.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Node not found");
    }

    const json = await request.json();
    const parsed = updateNodeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }

    const node = await prisma.node.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        services: {
          select: { id: true, name: true, currentStatus: true },
        },
      },
    });

    return NextResponse.json({ data: node });
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

    const existing = await prisma.node.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Node not found");
    }

    await prisma.node.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
