import { NextRequest, NextResponse } from "next/server";
import { generateMockLogs } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logs = generateMockLogs(20).filter((l) => l.serviceId === params.id);
  return NextResponse.json({
    data: logs,
    meta: { total: logs.length, page: 1, limit: 50 },
  });
}
