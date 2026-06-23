import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CourseCard from "@/components/courses/CourseCard";
import ScrollVideoHero from "@/components/home/ScrollVideoHero";
import ParallaxSection from "@/components/home/ParallaxSection";
import { supabase, createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import { redirect } from "next/navigation";

async function getData(): Promise<{
  courseCount: number;
  featuredCourses: Course[];
}> {
  if (!supabase) {
    return { courseCount: 0, featuredCourses: [] };
  }

  try {
    const [countResult, coursesResult] = await Promise.all([
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    return {
      courseCount: countResult.count ?? 0,
      featuredCourses: (coursesResult.data as Course[]) ?? [],
    };
  } catch (error) {
    console.error("Error fetching homepage data from Supabase:", error);
    return { courseCount: 0, featuredCourses: [] };
  }
}

export default async function Home() {
  const supabaseClient = await createClient();
  
  let user = null;
  try {
    const { data } = await supabaseClient.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.error("Error fetching user session on homepage:", error);
  }

  if (user) {
    redirect("/dashboard");
  }

  const { courseCount, featuredCourses } = await getData();

  let userYearOrderIndex: number | null = null;
  if (user) {
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("current_year_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.current_year_id) {
        const { data: year } = await supabaseClient
          .from("years")
          .select("order_index")
          .eq("id", profile.current_year_id)
          .maybeSingle();
        if (year) {
          userYearOrderIndex = year.order_index;
        }
      }
    } catch (error) {
      console.error("Error fetching user profile/year on homepage:", error);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ─── HERO — Scroll-driven video ─── */}
        <ScrollVideoHero>
          <div className="mx-auto max-w-6xl px-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Column 1 — Copy (Arabic) */}
              <div className="flex flex-col gap-6">

                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.2] font-extrabold text-[#F0EDE6] tracking-tight">
                  منصه <br />
                  <span
                    className="font-light italic pl-1 text-[#FBBF24]/90"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    الاحياء
                  </span>{" "}
                  <br className="hidden sm:block" />
                  الاولي في بسيون                </h1>

                <p className="text-[#F0EDE6]/60 text-lg leading-relaxed max-w-lg font-light">
                  دروس مكثفه لجميع الفصول الدراسيه
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link
                    href="/courses"
                    id="hero-browse-cta"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#FBBF24] text-[#0F1623] text-sm font-bold tracking-wide hover:bg-[#F59E0B] hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] transition-all duration-300"
                  >
                    تصفح الكورسات
                  </Link>
                  {!user && (
                    <Link
                      href="/register"
                      id="hero-signup-cta"
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-white/10 text-[#F0EDE6]/80 text-sm font-semibold hover:border-[#FBBF24]/30 hover:text-white transition-all duration-300"
                    >
                      ابدأ مجاناً
                      <span
                        aria-hidden="true"
                        className="mr-1.5 transition-transform duration-300 hover:-translate-x-1"
                      >
                        ←
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Column 2 — Stats Card */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative w-full max-w-sm rounded-2xl bg-[#1A2235]/75 backdrop-blur-md border border-white/10 p-8 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:border-[#FBBF24]/30 hover:shadow-[0_20px_50px_rgba(251,191,36,0.05)] transition-all duration-500 group">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#FBBF24] text-5xl font-extrabold tracking-tight tabular-nums transition-transform duration-500 group-hover:scale-105 origin-right">
                      {courseCount}
                    </span>
                    <span className="text-[#F0EDE6]/50 text-xs font-semibold uppercase tracking-[0.15em] mt-1">
                      دورة تعليمية منشورة
                    </span>
                  </div>

                  <div className="h-px bg-white/10" />

                  <blockquote className="flex flex-col gap-3">
                    <p className="text-[#F0EDE6]/80 text-sm leading-relaxed italic font-light">
                      &ldquo;لا أنشر أي دورة تعليمية إلا بعد أن أتأكد تماماً من
                      أنها ستوفر عليك وقتاً أطول بكثير من وقت
                      دراستها.&rdquo;
                    </p>
                    <cite className="text-[#F0EDE6]/40 text-xs font-mono not-italic uppercase tracking-wider">
                      — احمد سعد
                    </cite>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </ScrollVideoHero>

        {/* ─── STUDY AND WIN SECTION ─── */}
        <section id="study-and-win" className="py-20 border-t border-[#ffffff08] bg-[#0F1623]">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Column 1 — Text content (Right in RTL / first in JSX) */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-right gap-6">
                <h2 className="badeen-display-regular text-[#C0E838] text-4xl md:text-5xl font-extrabold tracking-tight">
                  ذاكر واكسب
                </h2>
                <p className="text-[#F0EDE6]/80 text-lg md:text-xl leading-relaxed font-medium max-w-2xl">
                  وفرنالك اجواء تنافسية بينك وبين زمايلك عشان نحفزك تقفل .. لو طلعت من الأوائل في امتحانات المستر هتفوز بجوايز مش هتخطر على بالك .. هنروق على الأوائل المتفوقين
                </p>
                <Link
                  href="/"
                  id="study-win-cta"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[#C0E838] text-[#0F1623] text-base font-bold hover:bg-[#b0d530] transition-colors duration-300 shadow-[0_4px_20px_rgba(192,232,56,0.25)]"
                >
                  جرب الآن               </Link>
              </div>

              {/* Column 2 — Image container (Left in RTL / second in JSX) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center">
                  {/* Decorative background blob */}
                  <div
                    className="absolute inset-4 bg-[#0a4855] rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] z-0 shadow-lg"
                    style={{ transform: "rotate(-4deg)" }}
                  />
                  {/* Neon border outline */}
                  <div
                    className="absolute inset-2 border-2 border-[#C0E838]/80 rounded-[35%_65%_65%_35%_/_35%_35%_65%_65%] pointer-events-none z-10"
                    style={{ transform: "rotate(4deg)" }}
                  />
                  {/* Main Image Wrapper that clips the image to a matching blob shape */}
                  <div className="absolute inset-4 overflow-hidden rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] z-20 shadow-inner">
                    <img
                      src="/study_win.jpeg"
                      alt="ذاكر واكسب"
                      className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-700 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURED COURSES — Parallax ─── */}
        <ParallaxSection
          id="featured-courses"
          speed={-0.12}
          direction="up"
          className="py-20 md:py-28 border-t border-[#ffffff08]"
        >
          <div className="mx-auto max-w-6xl px-6">
            {/* Section header */}
            <div className="text-center mb-12 border-b border-[#ffffff08] pb-6">
              <h2 className="font-gravity text-3xl font-extrabold tracking-tight">
                {userYearOrderIndex ? "دروسك" : "اختار الصف الدراسي"}
              </h2>
            </div>

            {/* Grid of three grade levels matching the uploaded image design */}
            <div className={`grid grid-cols-1 ${userYearOrderIndex ? "max-w-md mx-auto" : "md:grid-cols-3"} gap-8`}>
              {/* Card 1 — الصف الدراسي الأول */}
              {(!userYearOrderIndex || userYearOrderIndex === 1) && (
                <Link
                  href="/courses?grade=1"
                  className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                    <img
                      src="/biology_grade1.png"
                      alt="الصف الدراسي الأول"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content Box */}
                  <div className="p-6 text-right flex flex-col gap-4">
                    <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                      الصف الدراسي الأول
                    </h3>
                    <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                    <p className="text-[#F0EDE6]/60 text-sm font-medium">
                      جميع كورسات الصف الأول الثانوي
                    </p>
                  </div>
                </Link>
              )}

              {/* Card 2 — الصف الدراسي الثاني */}
              {(!userYearOrderIndex || userYearOrderIndex === 2) && (
                <Link
                  href="/courses?grade=2"
                  className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                    <img
                      src="/biology_grade2.png"
                      alt="الصف الدراسي الثاني"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content Box */}
                  <div className="p-6 text-right flex flex-col gap-4">
                    <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                      الصف الدراسي الثاني
                    </h3>
                    <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                    <p className="text-[#F0EDE6]/60 text-sm font-medium">
                      جميع كورسات الصف الثاني الثانوي
                    </p>
                  </div>
                </Link>
              )}

              {/* Card 3 — الصف الدراسي الثالث */}
              {(!userYearOrderIndex || userYearOrderIndex === 3) && (
                <Link
                  href="/courses?grade=3"
                  className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                    <img
                      src="/biology_grade3.png"
                      alt="الصف الدراسي الثالث"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content Box */}
                  <div className="p-6 text-right flex flex-col gap-4">
                    <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                      الصف الدراسي الثالث
                    </h3>
                    <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                    <p className="text-[#F0EDE6]/60 text-sm font-medium">
                      جميع كورسات الصف الثالث الثانوي
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </ParallaxSection>

        {/* ─── METHODOLOGY (About Us) — Parallax ─── */}
        <ParallaxSection
          id="methodology"
          speed={-0.1}
          direction="up"
          className="py-20 md:py-28 border-t border-[#ffffff08] bg-[#1A2235]/20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="badeen-display-regular  text-[#F0EDE6] text-3xl font-extrabold tracking-tight">
                مصممه من اجل صناعه الاوائل              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12">
              {[
                {
                  step: "01",
                  title: "شرح مفصل للمنهج كامل ",
                  body: "كل اجزاء المنهج من اول السنه لاخرها ",
                },
                {
                  step: "02",
                  title: "اختبار علي كل درس",
                  body: "امتحان علي كل درس عشان تتاكد انك فهمت كل نقطه ",
                },
                {
                  step: "03",
                  title: "امتحانات تجريبيه ",
                  body: "امتحانات تجريبيه عشان تكون جاهز للامتحان",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-4 relative group">
                  <div className="font-mono text-3xl md:text-4xl font-extrabold text-[#FBBF24]/30 group-hover:text-[#FBBF24] transition-colors duration-500">
                    {step.step}
                  </div>
                  <h3 className="text-[#F0EDE6] text-lg font-bold">
                    {step.title}
                  </h3>
                  <p className="text-[#F0EDE6]/50 text-sm leading-relaxed font-light">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ParallaxSection>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#ffffff08] py-12 bg-[#06333c] text-center">
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
