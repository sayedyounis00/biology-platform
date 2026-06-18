"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleLessonCompleteAction(lessonId: string, isCompleted: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (isCompleted) {
    // Delete progress (unmark complete)
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
      
    if (error) {
      console.error("Error deleting progress:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Insert/Upsert progress (mark complete)
    const { error } = await supabase.from("lesson_progress").upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error inserting progress:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function markLessonCompleteAction(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: user.id,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error marking lesson complete:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
