import { NextRequest, NextResponse } from "next/server";
import { mockAlerts } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const alert = mockAlerts.find((a) => a.id === params.id) || mockAlerts[0];
  return NextResponse.json({ data: alert });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const alert = mockAlerts.find((a) => a.id === params.id) || mockAlerts[0];
  return NextResponse.json({ data: alert });
}

export async function DELETE() {
  return NextResponse.json({ data: { success: true } });
}
