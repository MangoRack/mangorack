import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const setupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Only allow setup if no users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: { code: "ALREADY_SETUP", message: "An admin account already exists" } },
        { status: 409 }
      );
    }

    const body = await request.json();
    const data = setupSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Use a transaction with an atomic check to prevent TOCTOU race conditions.
    // Re-check count inside the transaction so concurrent requests cannot both proceed.
    const user = await prisma.$transaction(async (tx) => {
      const countInTx = await tx.user.count();
      if (countInTx > 0) {
        throw new Error("ALREADY_SETUP");
      }
      return tx.user.create({
        data: {
          email: data.email,
          name: data.name || "Admin",
          passwordHash,
          settings: {
            create: {
              theme: "system",
            },
          },
        },
        select: { id: true, email: true, name: true },
      });
    });

    return NextResponse.json({ data: { success: true, user } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === "ALREADY_SETUP") {
      return NextResponse.json(
        { error: { code: "ALREADY_SETUP", message: "An admin account already exists" } },
        { status: 409 }
      );
    }
    // Handle unique constraint violation (e.g., duplicate email from concurrent request)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: { code: "ALREADY_SETUP", message: "An admin account already exists" } },
        { status: 409 }
      );
    }
    logger.error("Setup error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Setup failed" } },
      { status: 500 }
    );
  }
}
