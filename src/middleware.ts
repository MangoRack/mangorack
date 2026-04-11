import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user

  const isOnLogin = nextUrl.pathname === "/login"
  const isOnSetup = nextUrl.pathname === "/setup"

  // Redirect logged-in users away from login/setup
  if (isOnLogin || isOnSetup) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  // Protect all other matched routes: redirect to /login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/ingest|_next/static|_next/image|favicon.ico).*)",
  ],
}
