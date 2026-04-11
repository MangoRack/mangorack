import { NextResponse } from "next/server";
import { mockNodes } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: mockNodes });
}

export async function POST() {
  return NextResponse.json({ data: mockNodes[0] }, { status: 201 });
}
