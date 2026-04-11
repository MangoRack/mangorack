import { NextResponse } from "next/server";
import { mockLicenseStatus } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: mockLicenseStatus });
}
