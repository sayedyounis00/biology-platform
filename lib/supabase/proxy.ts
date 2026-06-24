import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "./timeout-fetch";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => fetchWithTimeout(url, options),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard
  // to debug issues with users being randomly logged out.
  // We only run this if there is actually a session cookie or auth header present,
  // to avoid hitting timeouts for non-logged-in users. We also wrap it in try/catch.
  try {
    const hasAuthCookie = request.cookies.getAll().some((cookie) =>
      cookie.name.includes("auth-token") || cookie.name.startsWith("sb-")
    );
    const hasAuthHeader = !!request.headers.get("Authorization");

    if (hasAuthCookie || hasAuthHeader) {
      await supabase.auth.getUser();
    }
  } catch (error) {
    console.error("Supabase session refresh failed in proxy middleware:", error);
  }

  return supabaseResponse;
}

