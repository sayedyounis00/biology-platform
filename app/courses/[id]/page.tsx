import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import LessonCard from "@/components/courses/LessonCard";
import { supabase, createClient } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/types";
import { cookies } from "next/headers";

export default async function CourseLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = rawId.split("-").slice(0, 5).join("-");

  if (!supabase) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-28 pb-16 bg-[#0F1623]">
          <div className="mx-auto max-w-6xl px-6 w-full">
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A2235] border border-[#ffffff14] rounded-2xl p-8 max-w-md mx-auto">
              <span className="text-[#FBBF24] text-4xl mb-4" aria-hidden="true">⚠️</span>
              <h2 className="text-[#F0EDE6] text-lg font-bold mb-2">Could not load lessons</h2>
              <p className="text-[#F0EDE6]/60 text-sm">
                There was a problem communicating with the server. Please try again later.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const supabaseClient = await createClient();
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  // Fetch course details, lessons, and enrollment in parallel
  let course: Course;
  let lessons: Lesson[] = [];
  let lessonsErrorOccurred = false;
  let enrollmentData = null;

  try {
    const coursePromise = supabase
      .from("courses")
      .select("id, title, description, thumbnail_url, price, is_published, created_at")
      .eq("id", id)
      .single();

    const lessonsPromise = supabase
      .from("lessons")
      .select("id, course_id, title, content, video_url, order_index, created_at")
      .eq("course_id", id)
      .order("created_at", { ascending: false });

    const enrollmentPromise = userId
      ? supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [courseResult, lessonsResult, enrollmentResult] = await Promise.all([
      coursePromise,
      lessonsPromise,
      enrollmentPromise
    ]);

    if (courseResult.error || !courseResult.data) {
      notFound();
    }
    course = courseResult.data as Course;

    if (lessonsResult.error) {
      console.error("Error fetching lessons for course ID:", id, lessonsResult.error);
      lessonsErrorOccurred = true;
    } else {
      lessons = (lessonsResult.data as Lesson[]) || [];
    }

    enrollmentData = enrollmentResult.data;
  } catch (error) {
    console.error("Error in parallel database fetch on course page:", error);
    notFound();
  }

  // If the course is paid, protect access via enrollment check
  if (course.price && course.price > 0) {
    if (!userId) {
      redirect("/register");
    }

    if (!enrollmentData) {
      redirect(`/courses/${rawId}/payment`);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-28 pb-16 bg-[#0F1623]">
        <div className="mx-auto max-w-6xl px-6 w-full">
          {/* ─── Breadcrumb ─── */}
          <nav className="flex items-center gap-2 text-sm text-[#F0EDE6]/40 mb-8" aria-label="Breadcrumb">
            <Link
              href="/courses"
              className="hover:text-[#FBBF24] transition-colors"
            >
              الكورسات
            </Link>
            <span aria-hidden="true">
              <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="text-[#F0EDE6]/70 font-medium truncate max-w-xs">
              {course.title}
            </span>
          </nav>

          {/* ─── Section divider ─── */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-l from-[#FBBF24]/20 to-transparent" />
            <h2 className="text-[#F0EDE6] text-lg font-bold whitespace-nowrap">
              الدروس
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#FBBF24]/20 to-transparent" />
          </div>

          {/* ─── Lessons grid / states ─── */}
          {lessonsErrorOccurred ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A2235] border border-[#ffffff14] rounded-2xl p-8 max-w-md mx-auto">
              <span className="text-[#FBBF24] text-4xl mb-4" aria-hidden="true">⚠️</span>
              <h2 className="text-[#F0EDE6] text-lg font-bold mb-2">
                Could not load lessons
              </h2>
              <p className="text-[#F0EDE6]/60 text-sm">
                There was a problem fetching the lessons. Please try again later.
              </p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1A2235] border border-[#ffffff14] flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#F0EDE6]/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-[#F0EDE6]/60 text-lg font-medium">
                لا توجد دروس بعد. تابعنا قريبًا.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
              {lessons.map((lesson) => (
                <Link key={lesson.id} href={`/courses/${rawId}/lessons/${lesson.id}`} className="block">
                  <LessonCard lesson={lesson} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#ffffff08] py-12 bg-[#06333c] text-center mt-auto">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center">
          {/* Social Icons Container */}
          <div className="flex items-center justify-center gap-4">

            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1CtxMSWcrR/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(24,119,242,0.3)]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com/@biologiestahmedsaad3579?si=8L2wJ6ctlh8aYG5m"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(255,0,0,0.3)]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.53 12 3.53 12 3.53s-7.53 0-9.388.525A3.003 3.003 0 0 0 .502 6.163C0 8.04 0 12 0 12s0 3.96.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.47 12 20.47 12 20.47s7.53 0 9.388-.525a3.003 3.003 0 0 0 2.11-2.108C24 15.96 24 12 24 12s0-3.96-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          {/* Divider line */}
          <div className="w-full max-w-[440px] h-[1px] bg-white/10 my-6" />

          {/* Slogan */}
          <p className="text-[#F0EDE6]/90 text-sm md:text-base mb-4 flex items-center justify-center gap-2">
            ❤️ تم صنع هذه المنصة بهدف تهيئة الطالب لـ كامل جوانب الثانوية العامة و ما بعدها ❤️
          </p>

          {/* Credits and Copyright */}
          <div className="text-xs md:text-sm flex flex-wrap items-center justify-center gap-2 font-sans mt-2">
            <span className="text-[#C0E838] font-bold">&lt; Developed By &gt;</span>
            <span className="px-2.5 py-0.5 rounded bg-[#0b4e5a] border border-[#00d0ff]/20 text-[#F0EDE6] text-xs font-semibold">Sayed</span>
            <span className="text-[#F0EDE6] font-semibold">,</span>
            <span className="text-[#C0E838] font-bold">&lt; All Copy Rights Reserved @2026 &gt;</span>
          </div>
        </div>
      </footer>
    </>
  );
}
