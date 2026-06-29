import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CourseCard from "@/components/courses/CourseCard";
import { supabase, createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import { cookies } from "next/headers";

const gradeLabels: Record<string, string> = {
  "1": "الصف الأول الثانوي    (علوم متكامله )",
  "2": "الصف الثاني الثانوي",
  "3": "الصف الثالث الثانوي",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabaseClient = await createClient();

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  const isLoggedIn = !!userId;

  let allYears: any[] = [];
  let enrolledCourseIds: string[] = [];
  let userYearOrderIndex: number | null = null;

  try {
    const yearsPromise = supabaseClient.from("years").select("id, title, order_index");
    const enrollmentsPromise = userId
      ? supabaseClient.from("enrollments").select("course_id").eq("user_id", userId)
      : Promise.resolve({ data: null });
    const profilePromise = userId
      ? supabaseClient.from("profiles").select("current_year_id").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null });

    const [yearsRes, enrollmentsRes, profileRes] = await Promise.all([
      yearsPromise,
      enrollmentsPromise,
      profilePromise
    ]);

    allYears = yearsRes.data || [];

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
    console.error("Error fetching initial data on courses page:", e);
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

            {/* Grade filter tabs */}
            {!userYearOrderIndex && (
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                {["1", "2", "3"].map((g) => (
                  <Link
                    key={g}
                    href={`/courses?grade=${g}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${gradeFilter === g
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
