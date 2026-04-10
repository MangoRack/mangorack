import { NextResponse } from "next/server"
import { z } from "zod"
import { validateLicenseKey } from "@/lib/license"
import { getFeatureStatus } from "@/lib/limits"
import { auth } from "@/lib/auth"

const validateSchema = z.object({
  key: z.string().min(1, "License key is required"),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const result = await validateLicenseKey(validation.data.key)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, plan: "FREE", error: result.error },
        { status: 400 }
      )
    }

    const status = await getFeatureStatus()

    return NextResponse.json({
      valid: true,
      plan: result.plan,
      expiresAt: result.expiresAt,
      features: status.features,
    })
  } catch (error) {
    console.error("License validation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
