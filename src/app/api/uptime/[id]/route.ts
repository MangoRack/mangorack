import { NextRequest, NextResponse } from "next/server";
import { mockServices, generateUptimeChecks } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = mockServices.find((s) => s.id === params.id) || mockServices[0];
  const checks = generateUptimeChecks(service.id);
  const checksUp = checks.filter((c) => c.status === "UP" || c.status === "DEGRADED").length;
  const responseTimes = checks.map((c) => c.responseTime).filter((rt): rt is number => rt !== null);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const timeline = checks.map((c) => ({
    timestamp: c.checkedAt,
    status: c.status,
    avgResponseTime: c.responseTime ?? 0,
    checks: 1,
  }));

  return NextResponse.json({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      currentStatus: service.currentStatus,
      uptimePercent: service._uptimePercent,
      avgResponseTime,
      checksTotal: checks.length,
      checksUp,
      timeline,
    },
  });
}
