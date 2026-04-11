import { NextResponse } from "next/server";
import { mockServices } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    data: mockServices,
    meta: { total: mockServices.length, page: 1, limit: 20 },
  });
}

export async function POST() {
  return NextResponse.json({ data: mockServices[0] }, { status: 201 });
}
