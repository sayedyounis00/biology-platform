import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function setDeviceSession(userId: string) {
  const deviceToken = crypto.randomUUID();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown Device";
  
  const supabase = await createClient();
  await supabase.from("user_sessions").upsert({
    user_id: userId,
    session_token: deviceToken,
    device_info: userAgent,
    last_active: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const cookieStore = await cookies();
  cookieStore.set("device_token", deviceToken, {
    path: "/",
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });
}
