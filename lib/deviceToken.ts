import { cookies, headers } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";

export async function setDeviceSession(userId: string, supabaseClient: SupabaseClient) {
  const deviceToken = crypto.randomUUID();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown Device";
  
  const { error } = await supabaseClient.from("user_sessions").upsert({
    user_id: userId,
    session_token: deviceToken,
    device_info: userAgent,
    last_active: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to upsert device session:", error);
  }

  const cookieStore = await cookies();
  cookieStore.set("device_token", deviceToken, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });
}
