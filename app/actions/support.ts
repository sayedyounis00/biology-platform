"use server";

import { createClient } from "@/lib/supabase/server";

export interface ComplaintState {
  success?: boolean;
  error?: string | null;
}

export async function submitComplaint(prevState: any, formData: FormData): Promise<ComplaintState> {
  const text = formData.get("complaintText") as string;
  const manualPhone = formData.get("phone") as string | null;
  const userId = formData.get("userId") as string | null;

  if (!text || text.trim() === "") {
    return { error: "يرجى كتابة تفاصيل المشكلة" };
  }

  if (!userId) {
    return { error: "يجب تسجيل الدخول لإرسال شكوى" };
  }

  try {
    const supabase = await createClient();

    // Fetch name & phone from the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    const userName = profile?.full_name || "غير محدد";
    
    // Use profile phone if available, otherwise use manually submitted phone
    let phoneNumber = profile?.phone || "";
    
    if (!phoneNumber && manualPhone && manualPhone.trim()) {
      phoneNumber = manualPhone.trim();
      
      // Also save the phone to the user's profile for future use
      await supabase
        .from("profiles")
        .update({ phone: phoneNumber, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    if (!phoneNumber) {
      return { error: "يرجى إدخال رقم الهاتف" };
    }

    if (phoneNumber.length < 7) {
      return { error: "يرجى إدخال رقم هاتف صحيح" };
    }

    // Insert complaint linked to the user
    const { error } = await supabase.from("complaints").insert({
      complaint_text: text.trim(),
      user_id: userId,
      user_name: userName,
      phone_number: phoneNumber,
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
