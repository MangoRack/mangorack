import { NextRequest, NextResponse } from "next/server";
import { mockServices, generateUptimeChecks } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = mockServices.find((s) => s.id === params.id) || mockServices[0];
  return NextResponse.json({
    data: {
      ...service,
      uptimeChecks: generateUptimeChecks(service.id).slice(0, 10),
    },
  });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = mockServices.find((s) => s.id === params.id) || mockServices[0];
  return NextResponse.json({ data: service });
}

export async function DELETE() {
  return NextResponse.json({ data: { success: true } });
}
