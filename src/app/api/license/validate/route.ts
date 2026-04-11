import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateLicenseKey } from "@/lib/license";
import { requireAuth } from "@/lib/auth-helpers";
import { errorResponse } from "@/lib/auth-helpers";

const schema = z.object({ key: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { key } = schema.parse(body);
    const result = await validateLicenseKey(key);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid license key" } },
        { status: 400 }
      );
    }
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
