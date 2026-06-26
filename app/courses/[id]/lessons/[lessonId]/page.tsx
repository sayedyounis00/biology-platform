import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import LessonViewer from "@/components/courses/LessonViewer";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/types";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: rawId, lessonId: rawLessonId } = await params;
  const id = rawId.split("-").slice(0, 5).join("-");
  const lessonId = rawLessonId.split("-").slice(0, 5).join("-");

  const supabaseClient = await createClient();

  // Step 1: Fetch user, course details, current lesson details, and all lessons in parallel
  let course: Course;
  let lesson: Lesson;
  let allLessons: Lesson[] = [];
  let user = null;

  try {
    const [userRes, courseRes, lessonRes, allLessonsRes] = await Promise.all([
      supabaseClient.auth.getUser(),
      supabaseClient
        .from("courses")
        .select("id, title, description, price, is_published")
        .eq("id", id)
        .single(),
      supabaseClient
        .from("lessons")
        .select("id, course_id, title, content, video_url, order_index, attachment_urls, created_at")
        .eq("id", lessonId)
        .eq("course_id", id)
        .single(),
      supabaseClient
        .from("lessons")
        .select("id, title, order_index, created_at, video_url")
        .eq("course_id", id)
        .order("order_index", { ascending: true })
    ]);

    user = userRes.data?.user || null;
    if (!user) {
      redirect("/login");
    }

    if (courseRes.error || !courseRes.data) {
      notFound();
    }
    course = courseRes.data as Course;

    if (!course.is_published) {
      notFound();
    }

    if (lessonRes.error || !lessonRes.data) {
      notFound();
    }
    lesson = lessonRes.data as Lesson;

    allLessons = (allLessonsRes.data || []) as Lesson[];
  } catch (error) {
    console.error("Error in parallel fetch Step 1 on lesson page:", error);
    notFound();
  }

  // Step 2: Fetch enrollment check and lesson progress in parallel
  let initialCompletedLessonIds: string[] = [];

  try {
    const enrollmentPromise = (course.price && course.price > 0)
      ? supabaseClient
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle()
      : Promise.resolve({ data: { id: "free" }, error: null });

    const progressPromise = allLessons.length > 0
      ? supabaseClient
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", allLessons.map((l) => l.id))
          .eq("completed", true)
      : Promise.resolve({ data: [], error: null });

    const [enrollmentRes, progressRes] = await Promise.all([
      enrollmentPromise,
      progressPromise
    ]);

    // If the course is paid, protect access via enrollment check
    if (course.price && course.price > 0 && (!enrollmentRes.data || enrollmentRes.error)) {
      redirect(`/courses/${rawId}/payment`);
    }

    initialCompletedLessonIds = (progressRes.data || []).map((p) => p.lesson_id);
  } catch (error) {
    console.error("Error in parallel fetch Step 2 on lesson page:", error);
  }

  // Base64 encode the video URL to prevent raw link showing in View Source
  const encodedVideoUrl = lesson.video_url
    ? Buffer.from(lesson.video_url).toString("base64")
    : "";

  return (
    <>
      <Navbar />

      <main className="flex-1 min-h-screen pt-28 pb-16 bg-[#0F1623] text-[#F0EDE6]" dir="rtl">
        <div className="mx-auto max-w-7xl px-6 w-full flex flex-col gap-6">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-[#F0EDE6]/60">
            <Link href="/courses" className="hover:text-[#FBBF24] transition-colors">
              الكورسات
            </Link>
            <span>/</span>
            <Link href={`/courses/${rawId}`} className="hover:text-[#FBBF24] transition-colors max-w-[150px] md:max-w-xs truncate">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-[#FBBF24] font-medium max-w-[150px] md:max-w-xs truncate">
              {lesson.title}
            </span>
          </nav>

          {/* Mount the interactive Client Viewer */}
          <LessonViewer
            course={course}
            lesson={lesson}
            allLessons={allLessons}
            initialCompletedLessonIds={initialCompletedLessonIds}
            userId={user.id}
            rawId={rawId}
            encodedVideoUrl={encodedVideoUrl}
          />

        </div>
      </main>
    </>
  );
}
