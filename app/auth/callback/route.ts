import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setDeviceSession } from "@/lib/deviceToken";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await setDeviceSession(user.id);
        const { data: profile } = await supabase.from("profiles").select("phone, current_year_id").eq("id", user.id).single();
        if (!profile?.phone || !profile?.current_year_id) {
          return NextResponse.redirect(`${origin}/profile`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
