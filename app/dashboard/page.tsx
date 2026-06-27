import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import ExamNote from "@/components/dashboard/ExamNote";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.error("Error checking auth user on dashboard page:", error);
  }

  if (!user) {
    redirect("/login");
  }

  let profile = null;
  let enrolledCourses: any[] = [];
  let exams: any[] = [];

  try {
    const [profileResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
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
      console.error("Error fetching user profile details on dashboard:", profileResult.error);
    } else {
      profile = profileResult.data;
    }

    if (enrollmentsResult.error) {
      console.error("Error fetching enrolled courses for dashboard:", enrollmentsResult.error);
    } else {
      enrolledCourses = enrollmentsResult.data || [];
    }

    if (profile?.current_year_id) {
      const [examsResult, submissionsResult] = await Promise.all([
        supabase
          .from("exams")
          .select("*")
          .eq("year_id", profile.current_year_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("exam_submissions")
          .select("exam_id")
          .eq("user_id", user.id)
      ]);

      if (examsResult.error) {
        console.error("Error fetching exams for dashboard:", examsResult.error);
      } else {
        const submittedExamIds = new Set((submissionsResult.data || []).map((s: any) => s.exam_id));
        exams = (examsResult.data || []).filter((exam: any) => !submittedExamIds.has(exam.id));
      }
    }
  } catch (error) {
    console.error("Error in parallel database fetch on dashboard page:", error);
  }

  const subscribedCourses = enrolledCourses
    .map((enrollment: any) => enrollment.courses)
    .filter(Boolean);

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-28 pb-16 bg-[#0F1623] relative overflow-hidden flex flex-col items-center px-4" dir="rtl">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C0E838]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-6xl relative z-10">
          {/* Header */}
          <div className="mb-10 text-right">
            <h1 className="text-4xl font-extrabold text-[#F0EDE6] mb-3 tracking-tight">
              مرحباً، {profile?.full_name || user.user_metadata?.full_name || "طالبنا العزيز"} 👋
            </h1>
            <p className="text-[#F0EDE6]/60 text-lg font-medium">
              هذه هي لوحة التحكم الخاصة بك. يمكنك متابعة دروسك والكورسات المشترك بها من هنا.
            </p>
          </div>

          {/* Subscribed Courses Section */}
          <div className="bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-[#F0EDE6] order-1 sm:order-2">
                كورساتي المشترك بها
              </h2>
              <div className="flex flex-wrap items-center gap-3 order-2 sm:order-1">
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#FBBF24]/10 text-[#FBBF24]">
                  {subscribedCourses.length} {subscribedCourses.length === 1 ? "كورس" : "كورسات"}
                </span>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold bg-[#C0E838] text-[#0F1623] hover:bg-[#b0d530] transition-all duration-300 shadow-[0_4px_12px_rgba(192,232,56,0.15)] hover:shadow-[0_6px_20px_rgba(192,232,56,0.25)] cursor-pointer"
                >
                  <span>تصفح الكورسات الجديدة</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 rtl:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {exams.length > 0 && exams.map((exam: any) => (
              <ExamNote key={exam.id} exam={exam} />
            ))}

            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16 bg-[#0F1623] rounded-xl border border-white/5">
                <p className="text-[#F0EDE6]/60 text-lg mb-6">
                  لم تشترك في أي كورس بعد. ابدأ رحلتك التعليمية الآن!
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#C0E838] text-[#0F1623] font-bold text-base transition-all duration-300 hover:bg-[#b0d530] hover:shadow-[0_0_25px_rgba(192,232,56,0.2)] cursor-pointer"
                >
                  تصفح الكورسات المتاحة
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscribedCourses.map((course: any) => {
                  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";
                  return (
                    <div
                      key={course.id}
                      className="group flex flex-col bg-[#0F1623] rounded-2xl border border-white/5 overflow-hidden hover:border-[#C0E838]/30 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(192,232,56,0.1)] text-right"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[4/3] w-full relative bg-[#1A2235] overflow-hidden">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#F0EDE6]/10 text-6xl font-black">
                            {firstLetter}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1623] via-transparent to-transparent opacity-80" />
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-[#F0EDE6] font-bold text-xl mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-[#F0EDE6]/50 text-sm line-clamp-2 mb-6">
                            {course.description}
                          </p>
                        )}
                        
                        <div className="mt-auto">
                          <Link
                            href={`/courses/${course.id}-${slugify(course.title)}`}
                            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            شاهد الآن
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
