import { createServerClient } from "@supabase/ssr";
import { createClient as createBasicClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "./timeout-fetch";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Legacy singleton client for non-auth data fetching (courses, lessons, etc.).
 * Existing pages import this as `{ supabase }`.
 */
export const supabase: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10
    ? createBasicClient(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch: (url, options) => fetchWithTimeout(url, options),
        },
      })
    : null;

/**
 * SSR-aware client for authenticated operations (login, signup, session refresh).
 * Uses cookies for session management.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => fetchWithTimeout(url, options),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

