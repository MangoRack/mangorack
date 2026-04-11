import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
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
  const status = healthy ? "ok" : "degraded";

  // Only expose detailed info to authenticated users
  let isAuthenticated = false;
  try {
    const session = await auth();
    isAuthenticated = !!(session?.user?.email);
  } catch {
    // not authenticated
  }

  if (isAuthenticated) {
    return NextResponse.json(
      {
        data: {
          status,
          db: dbStatus,
          redis: redisStatus,
          version: "1.0.0",
        },
      },
      { status: healthy ? 200 : 503 }
    );
  }

  return NextResponse.json(
    { data: { status } },
    { status: healthy ? 200 : 503 }
  );
}
