import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { validateLicenseKey } from "@/lib/license"

const setupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    licenseKey: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
  try {
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json(
        { error: "Setup already completed" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = setupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, licenseKey } = validation.data

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        settings: {
          create: {
            theme: "system",
            defaultTimeRange: "24h",
            notifyOnDown: true,
            notifyOnRecover: true,
          },
        },
      },
    })

    if (licenseKey && licenseKey.trim() !== "") {
      const licenseResult = await validateLicenseKey(licenseKey.trim())
      if (!licenseResult.valid) {
        // User created but license invalid - not a fatal error
        return NextResponse.json({
          success: true,
          userId: user.id,
          licenseWarning: licenseResult.error || "Invalid license key",
        })
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
