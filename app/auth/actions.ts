"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { setDeviceSession } from "@/lib/deviceToken";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  const user = data?.user;
  if (user) {
    await setDeviceSession(user.id, supabase);
    const { data: profile } = await supabase.from("profiles").select("phone, current_year_id").eq("id", user.id).single();
    if (!profile?.phone || !profile?.current_year_id) {
      redirect("/profile");
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect("/register?error=" + encodeURIComponent(error.message));
  }

  const user = data?.user;
  if (user) {
    await setDeviceSession(user.id);
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function getGoogleOAuthUrl() {
  const supabase = await createClient();
  const headersList = await headers();
  
  // Use forwarded host and proto headers to construct the URL dynamically
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || "https";
  
  let baseUrl = "http://localhost:3000";
  if (host) {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const scheme = isLocal ? "http" : proto;
    baseUrl = `${scheme}://${host}`;
  } else {
    const referer = headersList.get("referer");
    if (referer) {
      try {
        baseUrl = new URL(referer).origin;
      } catch (e) {
        // fallback
      }
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const studentId = formData.get("studentId") as string;
  const currentYearId = formData.get("currentYearId") as string;

  const yearId = currentYearId && currentYearId !== "" ? currentYearId : null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  let error;
  if (existingProfile) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        current_year_id: yearId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone: phone || null,
        current_year_id: yearId,
        updated_at: new Date().toISOString(),
      });
    error = insertError;
  }

  if (error) {
    redirect("/profile?error=" + encodeURIComponent(error.message));
  }

  // Auto-enroll in free courses of the selected year
  if (yearId) {
    try {
      const { data: freeCourses, error: coursesError } = await supabase
        .from("courses")
        .select("id")
        .eq("year_id", yearId)
        .eq("is_published", true)
        .or("price.eq.0,price.is.null");

      if (coursesError) {
        console.error("Error fetching free courses:", coursesError);
      } else if (freeCourses && freeCourses.length > 0) {
        // Get existing enrollments for this user to avoid duplicates
        const { data: existingEnrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", user.id);

        const existingCourseIds = new Set(existingEnrollments?.map(e => e.course_id) || []);
        const toEnroll = freeCourses.filter(c => !existingCourseIds.has(c.id));

        if (toEnroll.length > 0) {
          const insertData = toEnroll.map(c => ({
            user_id: user.id,
            course_id: c.id,
          }));

          const { error: enrollError } = await supabase
            .from("enrollments")
            .insert(insertData);

          if (enrollError) {
            console.error("Error inserting auto-enrollments:", enrollError);
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error in auto-enrollment:", err);
    }
  }

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    }
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  redirect("/");
}
