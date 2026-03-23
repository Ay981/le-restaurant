import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { localeCookieName } from "@/lib/i18n/config";

function detectLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.startsWith("am") || acceptLanguage.includes("am-")) {
    return "am";
  }

  return "en";
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isStaticFile = /\.[^/]+$/.test(pathname);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    isStaticFile
  ) {
    return NextResponse.next();
  }

  const existingLocale = request.cookies.get(localeCookieName)?.value;
  if (existingLocale === "en" || existingLocale === "am") {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(localeCookieName, detectLocale(request), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
