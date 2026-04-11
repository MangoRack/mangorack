import { NextResponse } from "next/server";
import { mockAlerts } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: mockAlerts });
}

export async function POST() {
  return NextResponse.json({ data: mockAlerts[0] }, { status: 201 });
}
