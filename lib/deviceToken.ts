import { cookies, headers } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";

export async function setDeviceSession(userId: string, supabaseClient: SupabaseClient) {
  const deviceToken = crypto.randomUUID();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown Device";
  
  const { data: existing } = await supabaseClient
    .from("user_sessions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let error;
  if (existing) {
    const res = await supabaseClient.from("user_sessions").update({
      session_token: deviceToken,
      device_info: userAgent,
      last_active: new Date().toISOString(),
    }).eq("user_id", userId);
    error = res.error;
  } else {
    const res = await supabaseClient.from("user_sessions").insert({
      user_id: userId,
      session_token: deviceToken,
      device_info: userAgent,
      last_active: new Date().toISOString(),
    });
    error = res.error;
  }

  if (error) {
    console.error("Failed to save device session:", error);
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
