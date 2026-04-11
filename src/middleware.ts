// Auth middleware disabled for demo mode
// export { auth as middleware } from "@/lib/auth"

import { NextResponse } from "next/server"

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/health|api/ingest|login|setup|_next/static|_next/image|favicon.ico).*)",
  ],
}
