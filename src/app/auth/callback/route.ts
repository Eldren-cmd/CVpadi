import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/build";
    const safeNext = next.startsWith("/") ? next : "/build";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (code) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
        throw new Error("Missing Supabase URL or public key in environment.");
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            },
          },
        },
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeNext, appUrl));
      }

      console.error(
        "exchangeCodeForSession failed:",
        error.message,
        error.status,
      );
      return NextResponse.redirect(
        new URL(
          `/login?error=oauth_failed&reason=${encodeURIComponent(error.message)}`,
          appUrl,
        ),
      );
    }

    return NextResponse.redirect(new URL("/login?error=oauth_failed", appUrl));
  } catch (err) {
    console.error("Auth callback error:", err);
    const requestUrl = new URL(request.url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
    return NextResponse.redirect(new URL("/login?error=oauth_failed", appUrl));
  }
}
