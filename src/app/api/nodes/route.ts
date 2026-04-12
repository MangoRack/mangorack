import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

const createNodeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["PHYSICAL", "VIRTUAL", "CONTAINER", "CLOUD"]).optional().default("PHYSICAL"),
  description: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  os: z.string().optional().nullable(),
  cpu: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

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
    const data = createNodeSchema.parse(json);

    const node = await prisma.node.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        os: data.os,
        cpu: data.cpu,
        ram: data.ram,
        storage: data.storage,
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ data: node }, { status: 201 });
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
