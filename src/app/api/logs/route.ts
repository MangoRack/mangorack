import { NextResponse } from "next/server";
import { generateMockLogs } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    data: generateMockLogs(50),
    meta: { total: 4521, page: 1, limit: 50 },
  });
}
