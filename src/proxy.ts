import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// In Next 16 the `middleware` convention is renamed to `proxy` and runs on the
// Node.js runtime by default, so `process.env` is read at request time.
//
// Gate every page and API route behind a valid session, except the login page,
// the login/health endpoints and static assets (excluded via the matcher).

const PUBLIC_PATHS = new Set(["/login"]);
// `/api/news/sync` enforces its own auth (session OR Bearer CRON_SECRET) so a cron
// job without a session cookie can still trigger it.
const PUBLIC_API = new Set(["/api/auth/login", "/api/health", "/api/news/sync"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_API.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await verifySessionToken(process.env.SESSION_SECRET, token);
  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = pathname && pathname !== "/" ? `?from=${encodeURIComponent(pathname)}` : "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except Next internals and static asset files (which must load
    // without auth so the login page can render).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$).*)",
  ],
};
