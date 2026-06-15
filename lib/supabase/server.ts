import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
 * Returns a real Supabase client if valid credentials exist,
 * or null if credentials are missing / placeholder values.
 */
export const supabase: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
