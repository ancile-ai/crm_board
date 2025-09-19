import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Check if user is authenticated and has @ancile.io email
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isProtected = request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.includes("/login")
  const isSamGov = request.nextUrl.pathname.includes("/sam-gov") || request.nextUrl.pathname.includes("sam.gov")

  if (!isSamGov && isProtected) {
    if (!token || !token.email?.endsWith("@ancile.io")) {
      // Redirect to login page for protected routes
      return NextResponse.redirect(new URL("/login", request.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/opportunities/:path*",
    "/api/stages/:path*",
    "/api/analytics/:path*",
  ],
}
