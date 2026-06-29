"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLessonCompleteAction(lessonId: string, isCompleted: boolean, userId: string) {
  const supabase = await createClient();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (isCompleted) {
    // Delete progress (unmark complete)
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
      
    if (error) {
      console.error("Error deleting progress:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Insert/Upsert progress (mark complete)
    const { error } = await supabase.from("lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error inserting progress:", error);
      return { success: false, error: error.message };
    }
  }

  // Not revalidating a specific path because it might be called from different course pages.
  // Revalidating the layout clears the router cache and ensures fresh data.
  revalidatePath("/courses", "layout");
  return { success: true };
}

export async function markLessonCompleteAction(lessonId: string, userId: string) {
  const supabase = await createClient();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error marking lesson complete:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/courses", "layout");
  return { success: true };
}
