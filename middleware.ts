import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAsset = /\.[^/]+$/.test(pathname);
  if (isPublicAsset || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/hospitals") ||
    pathname.startsWith("/api/ac-units");
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
    const redirectPath = token.role === "ADMIN" ? "/admin/dashboard" : "/tech/upload";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/tech/upload", request.url));
  }

  if (pathname.startsWith("/tech") && token?.role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
