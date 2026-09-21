import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy all /api/* requests to the Express backend.
 *
 * Set BACKEND_API_URL in your environment (.env locally, Vercel env vars in prod).
 * Do NOT include a trailing /api — the proxy appends the full path automatically.
 *
 * Examples:
 *   Local:  BACKEND_API_URL=http://localhost:5000
 *   Vercel: BACKEND_API_URL=https://your-backend.vercel.app
 */
const raw =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

// Strip any accidental trailing "/api" so paths are never doubled
const BACKEND_ORIGIN = raw.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const backendUrl = new URL(pathname + search, BACKEND_ORIGIN);
  return NextResponse.rewrite(backendUrl);
}

export const config = {
  matcher: "/api/:path*",
};
