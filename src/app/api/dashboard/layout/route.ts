import { NextResponse } from "next/server";

const defaultWidgets = [
  { id: "w1", type: "quick_stats", size: "medium", position: 0 },
  { id: "w2", type: "service_status", size: "medium", position: 1 },
  { id: "w3", type: "uptime_summary", size: "medium", position: 2 },
  { id: "w4", type: "log_stream", size: "medium", position: 3 },
  { id: "w5", type: "alerts_feed", size: "medium", position: 4 },
  { id: "w6", type: "response_time", size: "large", position: 5 },
];

export async function GET() {
  return NextResponse.json({
    data: {
      id: null,
      name: "Default",
      isDefault: true,
      layout: { widgets: defaultWidgets },
    },
  });
}

export async function POST() {
  return NextResponse.json({ data: { success: true } });
}
