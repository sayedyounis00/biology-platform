"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function loginUser(phone: string, passwordText: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("phone", phone)
    .eq("password", passwordText)
    .single();

  if (error || !profile) {
    return { error: "رقم الهاتف أو كلمة المرور غير صحيحة" };
  }

  // Set a cookie so Server Components can read the user session
  const cookieStore = await cookies();
  cookieStore.set("user_id", profile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return { profile };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("user_id");
  return { success: true };
}

export async function registerUser(formData: any) {
  const supabase = await createClient();

  // 1. Check if phone exists
  const { data: existingPhone } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", formData.phone)
    .maybeSingle();

  if (existingPhone) {
    return { error: "رقم الهاتف مسجل مسبقاً" };
  }

  // 3. Generate student_id
  const { data: latestProfile } = await supabase
    .from("profiles")
    .select("student_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextId = 1;
  if (latestProfile && latestProfile.student_id) {
    const parts = latestProfile.student_id.split("-");
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      nextId = parseInt(parts[1], 10) + 1;
    }
  }
  const student_id = `STD-${nextId.toString().padStart(5, "0")}`;

  // 4. Insert directly into profiles table
  const newProfile = {
    id: crypto.randomUUID(), // we disabled the fkey to auth.users.id
    full_name: formData.full_name,
    email: `${formData.phone}@biology-platform.local`, // Dummy email to satisfy any schema constraints
    phone: formData.phone,
    password: formData.password,
    governorate_name: formData.governorate_name,
    center_name: formData.center_name,
    parent_phone_number: formData.parent_phone_number || null,
    student_id: student_id,
    current_year_id: formData.current_year_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .insert(newProfile);

  if (error) {
    return { error: error.message };
  }

  // Auto-login the user after registration
  const cookieStore = await cookies();
  cookieStore.set("user_id", newProfile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return { success: true };
}

export async function updateProfileManual(userId: string, formData: any) {
  const supabase = await createClient();

  const yearId = formData.currentYearId && formData.currentYearId !== "" ? formData.currentYearId : null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.fullName,
      phone: formData.phone || null,
      parent_phone_number: formData.parentPhone || null,
      governorate_name: formData.governorate || null,
      center_name: formData.center || null,
      current_year_id: yearId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Auto-enroll in free courses of the selected year
  if (yearId) {
    try {
      const { data: freeCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("year_id", yearId)
        .eq("is_published", true)
        .or("price.eq.0,price.is.null");

      if (freeCourses && freeCourses.length > 0) {
        const { data: existingEnrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", userId);

        const existingCourseIds = new Set(existingEnrollments?.map(e => e.course_id) || []);
        const toEnroll = freeCourses.filter(c => !existingCourseIds.has(c.id));

        if (toEnroll.length > 0) {
          const insertData = toEnroll.map(c => ({
            user_id: userId,
            course_id: c.id,
          }));
          await supabase.from("enrollments").insert(insertData);
        }
      }
    } catch (err) {
      console.error("Auto-enroll error:", err);
    }
  }

  return { profile };
}
