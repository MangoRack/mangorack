import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const hours = 24;
  const series = [
    {
      id: `ms-cpu-${params.id}`,
      serviceId: params.id,
      name: "cpu_usage",
      unit: "%",
      points: Array.from({ length: hours * 4 }, (_, i) => ({
        id: `pt-cpu-${i}`,
        ts: new Date(Date.now() - (hours * 4 - i) * 900000).toISOString(),
        value: 20 + Math.random() * 40,
      })),
    },
    {
      id: `ms-mem-${params.id}`,
      serviceId: params.id,
      name: "memory_usage",
      unit: "MB",
      points: Array.from({ length: hours * 4 }, (_, i) => ({
        id: `pt-mem-${i}`,
        ts: new Date(Date.now() - (hours * 4 - i) * 900000).toISOString(),
        value: 256 + Math.random() * 512,
      })),
    },
  ];
  return NextResponse.json({ data: series });
}
