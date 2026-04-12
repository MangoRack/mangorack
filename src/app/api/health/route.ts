import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { auth } from "@/lib/auth";
import packageJson from "../../../../package.json";

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

  const dbUp = dbStatus === "ok";
  const redisUp = redisStatus === "ok";
  const status = !dbUp ? "error" : !redisUp ? "degraded" : "ok";
  const httpStatus = dbUp ? 200 : 503;

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
          version: packageJson.version,
        },
      },
      { status: httpStatus }
    );
  }

  return NextResponse.json(
    { data: { status } },
    { status: httpStatus }
  );
}
