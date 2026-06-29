"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitExam(examId: string, userId: string) {
  const supabase = await createClient();
  
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("exam_submissions")
    .insert({
      exam_id: examId,
      user_id: userId
    });

  if (error) {
    console.error("Error submitting exam:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
