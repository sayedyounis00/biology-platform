"use server";

import { createClient } from "@/lib/supabase/server";

export interface ComplaintState {
  success?: boolean;
  error?: string | null;
}

export async function submitComplaint(prevState: any, formData: FormData): Promise<ComplaintState> {
  const text = formData.get("complaintText") as string;

  if (!text || text.trim() === "") {
    return { error: "يرجى كتابة تفاصيل المشكلة" };
  }

  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لإرسال شكوى" };
    }

    // Fetch name & phone from the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    const phoneNumber = profile?.phone || "";

    // Insert complaint linked to the user
    const { error } = await supabase.from("complaints").insert({
      complaint_text: text.trim(),
      user_id: user.id,
      user_name: userName,
      phone_number: phoneNumber || null,
    });

    if (error) {
      console.error("Supabase error submitting complaint:", error);
      return { error: "حدث خطأ أثناء إرسال الشكوى. يرجى المحاولة مرة أخرى." };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Exception submitting complaint:", error);
    return { error: "حدث خطأ في النظام. يرجى المحاولة مرة أخرى." };
  }
}
