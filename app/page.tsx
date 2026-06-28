import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import ScrollVideoHero from "@/components/home/ScrollVideoHero";
import ParallaxSection from "@/components/home/ParallaxSection";
import { supabase, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getData(): Promise<{ courseCount: number }> {
  if (!supabase) {
    return { courseCount: 0 };
  }

  try {
    const countResult = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    return {
      courseCount: countResult.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching homepage data from Supabase:", error);
    return { courseCount: 0 };
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

  const { courseCount } = await getData();

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
                    className="bdeen pl-1 text-[#FBBF24]/90"
                  >
                    الاحياء
                  </span>{" "}
                  <br className="lalezar-regular" />
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
                <h2 className="badeen-display-regular text-[#FBBF24] text-4xl md:text-5xl font-extrabold tracking-tight">
                  ذاكر واكسب
                </h2>
                <p className="text-[#F0EDE6]/80 text-lg md:text-xl leading-relaxed font-medium max-w-2xl">
                  وفرنالك اجواء تنافسية بينك وبين زمايلك عشان نحفزك تقفل .. لو طلعت من الأوائل في امتحانات المستر هتفوز بجوايز مش هتخطر على بالك .. هنروق على الأوائل المتفوقين
                </p>
                <Link
                  href="/"
                  id="study-win-cta"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[#FBBF24] text-[#0F1623] text-base font-bold hover:bg-[#FBBF24] transition-colors duration-300 shadow-[0_4px_20px_rgba(192,232,56,0.25)]"
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
                    {/*replace with ahmed saad image */}
                    <Image
                      src="/study_win.jpeg"
                      alt="ذاكر واكسب"
                      fill
                      sizes="(max-width: 768px) 100vw, 440px"
                      className="object-cover scale-105 hover:scale-110 transition-transform duration-700 pointer-events-none"
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
              <h2 className="badeen-display-regular text-[#FBBF24] text-3xl font-extrabold tracking-tight">
                اختار الصف الدراسي
              </h2>
            </div>

            {/* Grid of three grade levels matching the uploaded image design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 — الصف الدراسي الأول */}
              {/* Card 1 */}
              <Link
                href="/courses?grade=1"
                className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                  <Image
                    src="/biology_grade1.png"
                    alt="الصف الدراسي الأول"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Box */}
                <div className="p-6 text-right flex flex-col gap-4">
                  <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                    الصف الأول الثانوي                  </h3>
                  <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                  <p className="text-[#F0EDE6]/60 text-sm font-medium">
                    جميع كورسات الصف الأول الثانوي
                  </p>
                </div>
              </Link>


              {/* Card 2 — الصف الدراسي الثاني */}
              {/* Card 2 */}
              <Link
                href="/courses?grade=2"
                className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                  <Image
                    src="/biology_grade2.png"
                    alt="الصف الدراسي الثاني"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Box */}
                <div className="p-6 text-right flex flex-col gap-4">
                  <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                    الصف الثاني الثانوي                  </h3>
                  <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                  <p className="text-[#F0EDE6]/60 text-sm font-medium">
                    جميع كورسات الصف الثاني الثانوي
                  </p>
                </div>
              </Link>


              {/* Card 3 — الصف الدراسي الثالث */}
              {/* Card 3 */}
              <Link
                href="/courses?grade=3"
                className="group block rounded-2xl bg-[#101725] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_12px_40px_rgba(13,148,136,0.15)]"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden bg-[#0A0E17]">
                  <Image
                    src="/biology_grade3.png"
                    alt="الصف الدراسي الثالث"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Box */}
                <div className="p-6 text-right flex flex-col gap-4">
                  <h3 className="text-[#F0EDE6] text-xl font-bold font-sans">
                    الصف الثالث الثانوي                  </h3>
                  <div className="h-[2px] w-full bg-teal-600/80 transition-colors group-hover:bg-teal-400" />
                  <p className="text-[#F0EDE6]/60 text-sm font-medium">
                    جميع كورسات الصف الثالث الثانوي
                  </p>
                </div>
              </Link>

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
              <h2 className="badeen-display-regular  text-[#FBBF24] text-4xl font-extrabold tracking-tight">
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
            <a
              href="https://www.facebook.com/elmagek.elsied.7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded bg-[#0b4e5a] border border-[#00d0ff]/20 text-[#F0EDE6] text-xs font-semibold hover:bg-[#0d6b7c] transition-colors"
            >
              Sayed
            </a>
            <span className="text-[#C0E838] font-bold">&lt; Developed By &gt;</span>
            <span className="text-[#F0EDE6] font-semibold">,</span>
            <span className="text-[#C0E838] font-bold">&lt; All Copy Rights Reserved @2026 &gt;</span>
          </div>
        </div>
      </footer>
    </>
  );
}
