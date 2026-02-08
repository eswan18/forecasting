import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes that don't require authentication.
 * All other routes will redirect to /login if no token is present.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/oauth", // OAuth login and callback routes
  "/api/health",
  "/api/me", // Returns null if not logged in, used by client components
];

/**
 * Check if a pathname matches any of the public routes.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // Use configured base URL when behind a reverse proxy, falling back to request origin for local dev.
    const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
    const loginUrl = new URL("/login", baseUrl);
    // Preserve the original URL for redirect after login (except for home page)
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", encodeURIComponent(pathname));
    }
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - allow the request
  // Note: Admin checks are handled at the layout level (/app/admin/layout.tsx)
  // since middleware can't easily make async DB calls to verify admin status
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
