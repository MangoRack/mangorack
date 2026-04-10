import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAuth();

    let layout = await prisma.dashboardLayout.findFirst({
      where: { isDefault: true },
    });

    if (!layout) {
      layout = await prisma.dashboardLayout.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    if (!layout) {
      // Return a default layout
      return NextResponse.json({
        data: {
          id: null,
          name: "Default",
          isDefault: true,
          layout: {
            widgets: [
              { id: "uptime-overview", type: "uptime-overview", x: 0, y: 0, w: 12, h: 4 },
              { id: "service-grid", type: "service-grid", x: 0, y: 4, w: 8, h: 6 },
              { id: "recent-logs", type: "recent-logs", x: 8, y: 4, w: 4, h: 6 },
              { id: "response-time-chart", type: "response-time-chart", x: 0, y: 10, w: 6, h: 4 },
              { id: "alerts-feed", type: "alerts-feed", x: 6, y: 10, w: 6, h: 4 },
            ],
          },
        },
      });
    }

    return NextResponse.json({ data: layout });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { name, layout, isDefault } = body;

    if (!layout || typeof layout !== "object") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "layout must be a valid JSON object" } },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Upsert: update existing default or create new
    const existing = await prisma.dashboardLayout.findFirst({
      where: { isDefault: true },
    });

    let saved;
    if (existing) {
      saved = await prisma.dashboardLayout.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          layout,
          isDefault: isDefault ?? true,
        },
      });
    } else {
      saved = await prisma.dashboardLayout.create({
        data: {
          name: name || "Default",
          layout,
          isDefault: isDefault ?? true,
        },
      });
    }

    return NextResponse.json({ data: saved });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
