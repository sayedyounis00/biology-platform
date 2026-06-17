import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import LessonCard from "@/components/courses/LessonCard";
import { supabase } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/types";

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

  // Fetch the course details
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, price, is_published, created_at")
    .eq("id", id)
    .single();

  if (courseError || !courseData) {
    notFound();
  }

  const course = courseData as Course;

  // Fetch lessons ordered by created_at descending (newest to oldest)
  const { data: lessonsData, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, course_id, title, content, video_url, order_index, created_at")
    .eq("course_id", id)
    .order("created_at", { ascending: false });

  if (lessonsError) {
    console.error("Error fetching lessons for course ID:", id, lessonsError);
  }

  const lessons: Lesson[] = (lessonsData as Lesson[]) || [];
  const lessonsErrorOccurred = !!lessonsError;

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

          {/* ─── Course Header ─── */}
          <div className="mb-12">
            {/* Thumbnail banner */}
            {course.thumbnail_url && (
              <div className="aspect-[3/1] max-h-64 rounded-2xl overflow-hidden mb-8 border border-[#ffffff14]">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 text-center">
              <span className="text-[#FBBF24] text-xs font-bold uppercase tracking-widest">
                محتوى الكورس
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F0EDE6] tracking-tight">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-[#F0EDE6]/50 text-base max-w-2xl mx-auto leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                {/* Lesson count */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A2235] border border-[#ffffff14]">
                  <svg className="w-4 h-4 text-[#FBBF24]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#F0EDE6]/70 text-xs font-semibold">
                    {lessons.length} {lessons.length === 1 ? "درس" : "دروس"}
                  </span>
                </div>

                {/* Price badge */}
                {(!course.price || course.price === 0) ? (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    مجاني
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/20">
                    {course.price} EGP
                  </span>
                )}
              </div>
            </div>
          </div>

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
                <LessonCard key={lesson.id} lesson={lesson} />
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
            {/* TikTok */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.62 4.2 1.12 1.25 2.7 2.06 4.38 2.33v3.86c-1.07-.12-2.12-.48-3.08-1.03-.96-.58-1.74-1.42-2.25-2.42v7.71c.01 1.95-.56 3.87-1.63 5.43-1.12 1.57-2.77 2.67-4.66 3.1-1.92.42-3.95.14-5.69-.78-1.71-.93-3.04-2.5-3.7-4.38-.69-1.92-.64-4.04.14-5.92.74-1.83 2.15-3.32 3.94-4.14 1.76-.79 3.79-.89 5.62-.27.01 1.42.01 2.83.01 4.25-.87-.41-1.85-.54-2.8-.35-.95.17-1.82.7-2.43 1.48-.61.79-.87 1.8-.73 2.79.13.98.66 1.87 1.45 2.47.78.6 1.77.85 2.76.7 1-.16 1.89-.77 2.43-1.63.49-.8.71-1.74.67-2.68V0z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="#"
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
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(255,0,0,0.3)]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.53 12 3.53 12 3.53s-7.53 0-9.388.525A3.003 3.003 0 0 0 .502 6.163C0 8.04 0 12 0 12s0 3.96.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.47 12 20.47 12 20.47s7.53 0 9.388-.525a3.003 3.003 0 0 0 2.11-2.108C24 15.96 24 12 24 12s0-3.96-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Group/Community */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Community Group"
              className="w-12 h-12 rounded-full bg-[#2ea6da] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(46,166,218,0.3)]"
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
