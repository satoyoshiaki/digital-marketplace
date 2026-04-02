import { UserRole } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  if (pathname === "/mypage") {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/seller")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (![UserRole.SELLER, UserRole.ADMIN].includes(token.role as UserRole)) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (token.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage", "/seller/:path*", "/admin/:path*"],
};
