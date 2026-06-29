import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/auth/actions";
import { slugify } from "@/lib/utils";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.error("Error checking auth user on profile page:", error);
  }

  if (!user) {
    redirect("/login");
  }

  let profile = null;
  let years: any[] = [];
  let enrolledCourses: any[] = [];

  try {
    const [profileResult, yearsResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("years")
        .select("id, title")
        .order("order_index", { ascending: true }),
      supabase
        .from("enrollments")
        .select(`
          course_id,
          enrolled_at,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            price
          )
        `)
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false })
    ]);

    if (profileResult.error) {
      console.error("Error fetching user profile details:", profileResult.error);
    } else {
      profile = profileResult.data;
    }

    if (yearsResult.error) {
      console.error("Error fetching years list on profile page:", yearsResult.error);
    } else {
      years = yearsResult.data || [];
    }

    if (enrollmentsResult.error) {
      console.error("Error fetching enrolled courses for profile:", enrollmentsResult.error);
    } else {
      enrolledCourses = enrollmentsResult.data || [];
    }
  } catch (error) {
    console.error("Error in parallel database fetch on profile page:", error);
  }

  const subscribedCourses = enrolledCourses
    .map((enrollment: any) => enrollment.courses)
    .filter(Boolean);

  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-28 pb-16 bg-[#0F1623] relative overflow-hidden flex items-center justify-center px-4">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#F0EDE6] mb-2 tracking-tight">
              الملف الشخصي للطالب
            </h1>
            <p className="text-[#F0EDE6]/60 text-sm">
              يمكنك الاطلاع على معلوماتك وتحديثها من هنا
            </p>
          </div>

          {/* Success / Error Messages */}
          {success === "true" && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
              تم تحديث البيانات بنجاح!
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {decodeURIComponent(error as string)}
            </div>
          )}

          {/* Card */}
          <div className="bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <ProfileForm user={user} profile={profile} years={years} />
          </div>

        </div>
      </main>
    </>
  );
}
