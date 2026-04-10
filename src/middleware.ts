export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: [
    "/((?!api/health|api/ingest|login|setup|_next/static|_next/image|favicon.ico).*)",
  ],
}
