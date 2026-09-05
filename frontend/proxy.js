import { NextResponse } from "next/server";

const backendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export function proxy(request) {
  const backendUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, backendApiUrl);

  return NextResponse.rewrite(backendUrl);
}

export const config = {
  matcher: "/api/:path*",
};