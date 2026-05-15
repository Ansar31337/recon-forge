import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/signup", "/forgot-password"];

const rolePaths: Record<string, string> = {
  superadmin: "/super-admin",
  enterprise: "/dashboard",
  regular: "/regular",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (publicPaths.includes(pathname) || pathname === "/") {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    const role = payload.role as string;

    if (pathname.startsWith("/super-admin") && role !== "superadmin") {
      return NextResponse.redirect(
        new URL(rolePaths[role] || "/login", request.url),
      );
    }

    if (pathname.startsWith("/dashboard") && role !== "enterprise") {
      return NextResponse.redirect(
        new URL(rolePaths[role] || "/login", request.url),
      );
    }

    if (pathname.startsWith("/regular") && role !== "regular") {
      return NextResponse.redirect(
        new URL(rolePaths[role] || "/login", request.url),
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
