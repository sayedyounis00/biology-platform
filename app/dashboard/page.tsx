"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ExamNote from "@/components/dashboard/ExamNote";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [subscribedCourses, setSubscribedCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("current_user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      router.push("/login");
      return;
    }

    setProfile(user);
    
    const fetchDashboardData = async () => {
      const supabase = createClient();
      
      try {
        // Fetch up-to-date profile just in case
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (dbProfile) {
          setProfile(dbProfile);
          localStorage.setItem("current_user", JSON.stringify(dbProfile));
        }
        
        const currentProfile = dbProfile || user;

        const { data: enrollments } = await supabase
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
          .eq("user_id", currentProfile.id)
          .order("enrolled_at", { ascending: false });

        if (enrollments) {
          const courses = enrollments
            .map((enrollment: any) => enrollment.courses)
            .filter(Boolean);
          setSubscribedCourses(courses);
        }

        if (currentProfile.current_year_id) {
          const [examsResult, submissionsResult] = await Promise.all([
            supabase
              .from("exams")
              .select("*")
              .eq("year_id", currentProfile.current_year_id)
              .order("created_at", { ascending: false }),
            supabase
              .from("exam_submissions")
              .select("exam_id")
              .eq("user_id", currentProfile.id)
          ]);

          if (!examsResult.error) {
            const submittedExamIds = new Set((submissionsResult.data || []).map((s: any) => s.exam_id));
            const availableExams = (examsResult.data || []).filter((exam: any) => !submittedExamIds.has(exam.id));
            setExams(availableExams);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1623]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    );
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
                  {subscribedCourses.length} {subscribedCourses.length === 1 ? "كورس" : "كورسات"}
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

            {subscribedCourses.length === 0 ? (
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
                {subscribedCourses.map((course: any) => {
                  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";
                  return (
                    <div
                      key={course.id}
                      className="group flex flex-col bg-[#0F1623] rounded-2xl border border-white/5 overflow-hidden hover:border-[#C0E838]/30 transition-all duration-500 text-right"
                    >
                      <div className="aspect-[4/3] w-full relative bg-[#1A2235] overflow-hidden">
                        {course.thumbnail_url ? (
                          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#F0EDE6]/10 text-6xl font-black">{firstLetter}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1623] via-transparent to-transparent opacity-80" />
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-[#F0EDE6] font-bold text-xl mb-2 line-clamp-2">{course.title}</h3>
                        {course.description && (
                          <p className="text-[#F0EDE6]/50 text-sm line-clamp-2 mb-6">{course.description}</p>
                        )}
                        
                        <div className="mt-auto">
                          <Link
                            href={`/courses/${course.id}-${slugify(course.title)}`}
                            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm transition-all"
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
