import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET() {
  let dbStatus = "ok";
  let redisStatus = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  try {
    await redis.ping();
  } catch {
    redisStatus = "error";
  }

  const allOk = dbStatus === "ok" && redisStatus === "ok";

  return NextResponse.json(
    {
      data: {
        status: allOk ? "ok" : "degraded",
        db: dbStatus,
        redis: redisStatus,
        version: "1.0.0",
      },
    },
    { status: allOk ? 200 : 503 }
  );
}
