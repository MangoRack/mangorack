import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError, errorResponse } from "@/lib/auth-helpers";
import { checkLimits, getLicensePlan } from "@/lib/limits";

const createNodeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["PHYSICAL", "VIRTUAL", "CONTAINER", "CLOUD"]).default("PHYSICAL"),
  hostname: z.string().max(255).optional(),
  ipAddress: z.string().max(45).optional(),
  os: z.string().max(100).optional(),
  cpu: z.string().max(100).optional(),
  ram: z.string().max(50).optional(),
  storage: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    await requireAuth();

    const nodes = await prisma.node.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: nodes });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = createNodeSchema.parse(body);

    // Check free tier limit
    const plan = await getLicensePlan();
    if (plan === "FREE") {
      const nodeCount = await prisma.node.count({
        where: { isActive: true },
      });
      const limit = checkLimits(plan, "nodes");
      if (nodeCount >= limit) {
        throw new ApiError(
          403,
          "LIMIT_REACHED",
          `Free plan allows up to ${limit} node(s). Upgrade to PRO for unlimited.`,
          true
        );
      }
    }

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
        tags: data.tags,
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
