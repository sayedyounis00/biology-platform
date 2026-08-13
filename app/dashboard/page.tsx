import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import ExamNote from "@/components/dashboard/ExamNote";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch enrollments, lesson accesses, exams, and submissions in parallel
  const [enrollmentsResult, lessonAccessResult, examsResult, submissionsResult] = await Promise.all([
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
          price,
          is_published
        )
      `)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("lesson_access")
      .select(`
        course_id,
        lesson_id,
        granted_at,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          price,
          is_published
        )
      `)
      .eq("user_id", userId)
      .order("granted_at", { ascending: false }),
    profile.current_year_id 
      ? supabase
          .from("exams")
          .select("*")
          .eq("year_id", profile.current_year_id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    profile.current_year_id
      ? supabase
          .from("exam_submissions")
          .select("exam_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: null, error: null })
  ]);

  const enrolledCourses: any[] = [];
  const enrolledCourseIds = new Set<string>();

  if (enrollmentsResult.data) {
    for (const enrollment of enrollmentsResult.data) {
      const c = (enrollment as any).courses;
      if (c && c.is_published === true) {
        enrolledCourses.push({ ...c, _type: "enrolled" });
        enrolledCourseIds.add(c.id);
      }
    }
  }

  // Add lesson_access courses that aren't already enrolled
  if (lessonAccessResult.data) {
    const accessByCourse = new Map<string, any>();
    for (const rec of lessonAccessResult.data) {
      const c = (rec as any).courses;
      if (c && c.is_published === true && !enrolledCourseIds.has(c.id) && !accessByCourse.has(c.id)) {
        accessByCourse.set(c.id, { ...c, _type: "lesson_access", _lessonId: rec.lesson_id });
      }
    }
    for (const course of accessByCourse.values()) {
      enrolledCourses.push(course);
    }
  }

  let exams: any[] = [];
  if (examsResult.data) {
    const submittedExamIds = new Set((submissionsResult.data || []).map((s: any) => s.exam_id));
    exams = examsResult.data.filter((exam: any) => !submittedExamIds.has(exam.id));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-28 pb-16 bg-[#0F1623] relative overflow-hidden flex flex-col items-center px-4" dir="rtl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C0E838]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-6xl relative z-10">
          <div className="mb-10 text-right">
            <h1 className="text-4xl font-extrabold text-[#F0EDE6] mb-3 tracking-tight">
              مرحباً، {profile?.full_name || "طالبنا العزيز"} 👋
            </h1>
            <p className="text-[#F0EDE6]/60 text-lg font-medium">
              هذه هي لوحة التحكم الخاصة بك. يمكنك متابعة دروسك والكورسات المشترك بها من هنا.
            </p>
          </div>

          <div className="bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-[#F0EDE6]">
                كورساتي المشترك بها
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#FBBF24]/10 text-[#FBBF24]">
                  {enrolledCourses.length} {enrolledCourses.length === 1 ? "كورس" : "كورسات"}
                </span>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold bg-[#C0E838] text-[#0F1623] hover:bg-[#b0d530] transition-all duration-300"
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

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-16 bg-[#0F1623] rounded-xl border border-white/5">
                <p className="text-[#F0EDE6]/60 text-lg mb-6">
                  لم تشترك في أي كورس بعد. ابدأ رحلتك التعليمية الآن!
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#C0E838] text-[#0F1623] font-bold text-base transition-all duration-300 hover:bg-[#b0d530]"
                >
                  تصفح الكورسات المتاحة
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course: any) => {
                  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";
                  const isLessonAccess = course._type === "lesson_access";
                  const courseSlug = `${course.id}-${slugify(course.title)}`;
                  const cardHref = isLessonAccess
                    ? `/courses/${courseSlug}/lessons/${course._lessonId}`
                    : `/courses/${courseSlug}`;
                  return (
                    <Link
                      key={course.id}
                      href={cardHref}
                      className="group flex flex-col bg-[#0F1623] rounded-2xl border border-white/5 overflow-hidden hover:border-[#C0E838]/30 transition-all duration-500 text-right"
                    >
                      <div className="aspect-[4/3] w-full relative bg-[#1A2235] overflow-hidden">
                        {course.thumbnail_url ? (
                          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#F0EDE6]/10 text-6xl font-black">{firstLetter}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1623] via-transparent to-transparent opacity-80" />
                        {isLessonAccess && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#FBBF24]/90 text-[#0F1623] text-xs font-bold">
                            محاضرة مفتوحة
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-[#F0EDE6] font-bold text-xl mb-2 line-clamp-2">{course.title}</h3>
                        {course.description && (
                          <p className="text-[#F0EDE6]/50 text-sm line-clamp-2 mb-6">{course.description}</p>
                        )}
                        
                        <div className="mt-auto">
                          <span
                            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-400 text-white font-bold text-sm transition-all"
                          >
                            شاهد الآن
                          </span>
                        </div>
                      </div>
                    </Link>
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
