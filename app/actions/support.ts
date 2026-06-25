"use server";

import { createClient } from "@/lib/supabase/server";

export interface ComplaintState {
  success?: boolean;
  error?: string | null;
}

export async function submitComplaint(prevState: any, formData: FormData): Promise<ComplaintState> {
  const text = formData.get("complaintText") as string;
  const name = formData.get("userName") as string;
  const phone = formData.get("phone") as string;

  if (!text || text.trim() === "") {
    return { error: "يرجى كتابة تفاصيل المشكلة" };
  }
  if (!name || name.trim() === "") {
    return { error: "يرجى إدخال الاسم" };
  }
  if (!phone || phone.trim() === "") {
    return { error: "يرجى إدخال رقم الهاتف" };
  }

  // Basic phone validation (digits, minimum length)
  const cleanPhone = phone.trim();
  if (cleanPhone.length < 7) {
    return { error: "يرجى إدخال رقم هاتف صحيح" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("complaints").insert({
      complaint_text: text.trim(),
      phone_number: cleanPhone,
      user_name: name.trim(),
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
