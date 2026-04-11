import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAuth();

    const data = await prisma.node.findMany({
      include: {
        services: {
          select: { id: true, name: true, currentStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const json = await request.json();

    if (!json.name) {
      throw new ApiError(400, "VALIDATION_ERROR", "Field 'name' is required");
    }

    const node = await prisma.node.create({
      data: {
        name: json.name,
        description: json.description,
        type: json.type ?? "PHYSICAL",
        hostname: json.hostname,
        ipAddress: json.ipAddress,
        os: json.os,
        cpu: json.cpu,
        ram: json.ram,
        storage: json.storage,
        tags: json.tags ?? [],
        isActive: json.isActive ?? true,
      },
    });

    return NextResponse.json({ data: node }, { status: 201 });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
