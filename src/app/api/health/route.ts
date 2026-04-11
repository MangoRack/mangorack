import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET() {
  let dbStatus = "error";
  let redisStatus = "error";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "ok";
  } catch {
    // db unreachable
  }

  try {
    await redis.ping();
    redisStatus = "ok";
  } catch {
    // redis unreachable
  }

  const healthy = dbStatus === "ok";
  return NextResponse.json(
    {
      data: {
        status: healthy ? "ok" : "degraded",
        db: dbStatus,
        redis: redisStatus,
        version: "1.0.0",
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
