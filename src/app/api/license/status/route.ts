import { NextResponse } from "next/server"
import { getFeatureStatus } from "@/lib/limits"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const status = await getFeatureStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("Failed to get license status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
