import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/auth/allowed-emails";
import type { Database } from "@/models/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-key";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Important: You must run supabase.auth.getUser() to refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = /^\/admin(\/|$)/.test(pathname);
  const isExcludedAdminRoute = /^\/admin-login(\/|$)/.test(pathname);

  if (isAdminRoute && !isExcludedAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (!isAllowedAdminEmail(user.email)) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unauthorized_email");
      const redirectResponse = NextResponse.redirect(url);
      if (
        redirectResponse.cookies &&
        typeof supabaseResponse.cookies?.getAll === "function"
      ) {
        const responseCookies = supabaseResponse.cookies.getAll() ?? [];
        for (const cookie of responseCookies) {
          redirectResponse.cookies.set(cookie);
        }
      }
      return redirectResponse;
    }

    if (user.app_metadata?.provider === "google") {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.provider_token) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("reason", "google_session_expired");
        const redirectResponse = NextResponse.redirect(url);
        if (
          redirectResponse.cookies &&
          typeof supabaseResponse.cookies?.getAll === "function"
        ) {
          const responseCookies = supabaseResponse.cookies.getAll() ?? [];
          for (const cookie of responseCookies) {
            redirectResponse.cookies.set(cookie);
          }
        }
        return redirectResponse;
      }
    }
  }

  return supabaseResponse;
}
