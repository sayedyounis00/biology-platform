"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitExam(examId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("exam_submissions")
    .insert({
      exam_id: examId,
      user_id: user.id
    });

  if (error) {
    console.error("Error submitting exam:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
