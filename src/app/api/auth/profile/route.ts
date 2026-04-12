import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireAuth, errorResponse, ApiError } from "@/lib/auth-helpers"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
})

export async function GET() {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found")
    }

    return NextResponse.json({ data: user })
  } catch (err) {
    const { status, body } = errorResponse(err)
    return NextResponse.json(body, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const json = await request.json()
    const data = updateProfileSchema.parse(json)

    const user = await prisma.user.update({
      where: { email: session.user!.email! },
      data: { name: data.name, email: data.email },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    return NextResponse.json({ data: user })
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
