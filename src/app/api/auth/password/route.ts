import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const json = await request.json()
    const data = changePasswordSchema.parse(json)

    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
    })

    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found")
    }

    const isCurrentValid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" } },
        { status: 400 }
      )
    }

    const newHash = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ data: { message: "Password updated successfully" } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          },
        },
        { status: 400 }
      )
    }
    const { status, body } = errorResponse(err)
    return NextResponse.json(body, { status })
  }
}
