import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      db: "ok",
      redis: "ok",
      version: "1.0.0",
    },
  });
}
