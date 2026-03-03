import type { NextRequest } from "next/server";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.method === "POST" && request.nextUrl.pathname.startsWith("/api/cv/preview/")) {
    const ipAddress = getClientIp(request.headers);
    const rateLimit = consumeRateLimit({
      key: `preview:${ipAddress}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many preview requests from this connection. Try again shortly.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
          status: 429,
        },
      );
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
