import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/build";
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
        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error(
        "exchangeCodeForSession failed:",
        error.message,
        error.status,
      );
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&reason=${encodeURIComponent(error.message)}`,
      );
    }

    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  } catch (err) {
    console.error("Auth callback error:", err);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}
