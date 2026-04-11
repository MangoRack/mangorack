import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

    const user = await prisma.user.create({
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

    return NextResponse.json({ data: { success: true, user } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") } },
        { status: 400 }
      );
    }
    logger.error("Setup error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Setup failed" } },
      { status: 500 }
    );
  }
}
