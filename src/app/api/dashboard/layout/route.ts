import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";

const defaultLayout = {
  widgets: [
    { id: "w1", type: "quick_stats", size: "medium", position: 0 },
    { id: "w2", type: "service_status", size: "medium", position: 1 },
    { id: "w3", type: "uptime_summary", size: "medium", position: 2 },
    { id: "w4", type: "log_stream", size: "medium", position: 3 },
    { id: "w5", type: "alerts_feed", size: "medium", position: 4 },
    { id: "w6", type: "response_time", size: "large", position: 5 },
  ],
};

export async function GET() {
  try {
    await requireAuth();

    const layout = await prisma.dashboardLayout.findFirst({
      where: { isDefault: true },
    });

    if (!layout) {
      return NextResponse.json({
        data: {
          id: null,
          name: "Default",
          isDefault: true,
          layout: defaultLayout,
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

    const json = await request.json();

    const existing = await prisma.dashboardLayout.findFirst({
      where: { isDefault: true },
    });

    const layout = await prisma.dashboardLayout.upsert({
      where: { id: existing?.id ?? "" },
      update: {
        name: json.name ?? "Default",
        layout: json.layout ?? defaultLayout,
        isDefault: true,
      },
      create: {
        name: json.name ?? "Default",
        layout: json.layout ?? defaultLayout,
        isDefault: true,
      },
    });

    return NextResponse.json({ data: layout });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
