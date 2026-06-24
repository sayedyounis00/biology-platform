import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CourseCard from "@/components/courses/CourseCard";
import { supabase, createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";

const gradeLabels: Record<string, string> = {
  "1": "الصف الأول الثانوي",
  "2": "الصف الثاني الثانوي",
  "3": "الصف الثالث الثانوي",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabaseClient = await createClient();

  let user = null;
  let allYears: any[] = [];

  try {
    const [userRes, yearsRes] = await Promise.all([
      supabaseClient.auth.getUser(),
      supabaseClient.from("years").select("id, title, order_index")
    ]);

    user = userRes.data?.user || null;
    allYears = yearsRes.data || [];
  } catch (e) {
    console.error("Error in parallel fetch Step 1 on courses page:", e);
  }

  const isLoggedIn = !!user;

  let enrolledCourseIds: string[] = [];
  let userYearOrderIndex: number | null = null;

  if (user) {
    try {
      const [enrollmentsRes, profileRes] = await Promise.all([
        supabaseClient.from("enrollments").select("course_id").eq("user_id", user.id),
        supabaseClient.from("profiles").select("current_year_id").eq("id", user.id).maybeSingle()
      ]);

      if (enrollmentsRes.data) {
        enrolledCourseIds = enrollmentsRes.data.map((e: any) => e.course_id);
      }

      const currentYearId = profileRes.data?.current_year_id;
      if (currentYearId) {
        const userYear = allYears.find((y) => y.id === currentYearId);
        if (userYear) {
          userYearOrderIndex = userYear.order_index;
        }
      }
    } catch (e) {
      console.error("Error in parallel fetch Step 2 on courses page:", e);
    }
  }

  const { grade } = await searchParams;

  // Enforce grade filter to user's selected year if they have one
  const gradeFilter = userYearOrderIndex
    ? userYearOrderIndex.toString()
    : (typeof grade === "string" ? grade : "1");

  let courses: Course[] = [];
  let errorOccurred = false;
  let yearTitle: string | null = null;

  if (supabase) {
    try {
      // Find the selected year in memory
      const selectedYear = allYears.find((y) => y.order_index === parseInt(gradeFilter, 10));

      if (selectedYear) {
        yearTitle = selectedYear.title;
        
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, description, thumbnail_url, price, is_published, created_at")
          .eq("is_published", true)
          .eq("year_id", selectedYear.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching courses:", error);
          errorOccurred = true;
        } else {
          courses = (data as Course[]) || [];
        }
      } else {
        courses = [];
      }
    } catch (error) {
      console.error("Error fetching courses data from Supabase:", error);
      errorOccurred = true;
    }
  } else {
    errorOccurred = true;
  }

  // Header text
  const eyebrow = gradeLabels[gradeFilter] ?? `Grade ${gradeFilter}`;
  const heading = gradeLabels[gradeFilter] ?? "الكورسات";

  const countText = errorOccurred
    ? "Failed to load courses count"
    : `${courses.length} ${courses.length === 1 ? "course" : "courses"} available`;

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-28 pb-16 bg-[#0F1623]">
        <div className="mx-auto max-w-6xl px-6 w-full">
          {/* Page header */}
          <div className="text-center mb-12 flex flex-col gap-2">
            <span className="text-[#FBBF24] text-xs font-bold uppercase tracking-widest">
              {eyebrow}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F0EDE6] tracking-tight">
              {heading}
            </h1>
            <p className="text-[#F0EDE6]/50 text-sm font-medium mt-1 font-mono">
              {countText}
            </p>

            {/* Grade filter tabs */}
            {!userYearOrderIndex && (
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                {["1", "2", "3"].map((g) => (
                  <Link
                    key={g}
                    href={`/courses?grade=${g}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${
                      gradeFilter === g
                        ? "bg-[#FBBF24] text-[#0F1623] border-[#FBBF24]"
                        : "bg-transparent text-[#F0EDE6]/60 border-[#ffffff14] hover:border-[#FBBF24]/40 hover:text-[#F0EDE6]"
                    }`}
                  >
                    {gradeLabels[g]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Error / Empty state / Grid */}
          {errorOccurred ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A2235] border border-[#ffffff14] rounded-2xl p-8 max-w-md mx-auto">
              <span className="text-[#FBBF24] text-4xl mb-4" aria-hidden="true">⚠️</span>
              <h2 className="text-[#F0EDE6] text-lg font-bold mb-2">Could not load courses</h2>
              <p className="text-[#F0EDE6]/60 text-sm">
                There was a problem communicating with the server. Please check your connection and try again.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[#F0EDE6]/60 text-lg font-medium">
                No courses published yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isLoggedIn={isLoggedIn}
                  isEnrolled={enrolledCourseIds.includes(course.id)}
                />
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
