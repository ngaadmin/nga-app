import { NextResponse, type NextRequest } from "next/server";
import { stripCredentialQueryParams } from "@/lib/auth/credential-query-guard";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Credentials never belong in a URL. If a form was submitted natively before
  // hydration, redirect to the same page without credential-like params. Only
  // key names are inspected; values are never read or logged.
  if (request.method === "GET" || request.method === "HEAD") {
    const cleaned = stripCredentialQueryParams(request.nextUrl);
    if (cleaned) {
      const response = NextResponse.redirect(cleaned, 303);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
