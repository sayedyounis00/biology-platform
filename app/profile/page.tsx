import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/auth/actions";
import { slugify } from "@/lib/utils";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.error("Error checking auth user on profile page:", error);
  }

  if (!user) {
    redirect("/login");
  }

  let profile = null;
  let years: any[] = [];
  let enrolledCourses: any[] = [];

  try {
    const [profileResult, yearsResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("years")
        .select("id, title")
        .order("order_index", { ascending: true }),
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
      console.error("Error fetching user profile details:", profileResult.error);
    } else {
      profile = profileResult.data;
    }

    if (yearsResult.error) {
      console.error("Error fetching years list on profile page:", yearsResult.error);
    } else {
      years = yearsResult.data || [];
    }

    if (enrollmentsResult.error) {
      console.error("Error fetching enrolled courses for profile:", enrollmentsResult.error);
    } else {
      enrolledCourses = enrollmentsResult.data || [];
    }
  } catch (error) {
    console.error("Error in parallel database fetch on profile page:", error);
  }

  const subscribedCourses = enrolledCourses
    .map((enrollment: any) => enrollment.courses)
    .filter(Boolean);

  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-28 pb-16 bg-[#0F1623] relative overflow-hidden flex items-center justify-center px-4">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#F0EDE6] mb-2 tracking-tight">
              الملف الشخصي للطالب
            </h1>
            <p className="text-[#F0EDE6]/60 text-sm">
              يمكنك الاطلاع على معلوماتك وتحديثها من هنا
            </p>
          </div>

          {/* Success / Error Messages */}
          {success === "true" && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
              تم تحديث البيانات بنجاح!
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {decodeURIComponent(error as string)}
            </div>
          )}

          {/* Card */}
          <div className="bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <form action={updateProfile} className="space-y-6">
              
              {/* Row 1: Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-[#F0EDE6]/70 mb-2"
                >
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  defaultValue={profile?.full_name || user.user_metadata?.full_name || ""}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300"
                />
              </div>

              {/* Row 2: Email (Disabled) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#F0EDE6]/40 mb-2"
                >
                  البريد الإلكتروني (لا يمكن تعديله)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full px-4 py-3 rounded-xl bg-[#0f1623]/50 border border-white/5 text-[#F0EDE6]/40 text-sm cursor-not-allowed"
                  dir="ltr"
                />
              </div>

              {/* Grid: Phone & Student ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-[#F0EDE6]/70 mb-2"
                  >
                    رقم الهاتف
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    defaultValue={profile?.phone || ""}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 text-right"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-medium text-[#F0EDE6]/40 mb-2"
                  >
                    كود الطالب (يتم إنشاؤه تلقائياً)
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    disabled
                    value={profile?.student_id || ""}
                    placeholder="سيظهر الكود الخاص بك هنا"
                    className="w-full px-4 py-3 rounded-xl bg-[#0f1623]/50 border border-white/5 text-[#F0EDE6]/40 text-sm cursor-not-allowed text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Row 4: Year/Grade Selection */}
              <div>
                <label
                  htmlFor="currentYearId"
                  className="block text-sm font-medium text-[#F0EDE6]/70 mb-2"
                >
                  السنة الدراسية / الصف
                </label>
                <select
                  id="currentYearId"
                  name="currentYearId"
                  required
                  defaultValue={profile?.current_year_id || ""}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 appearance-none bg-no-repeat bg-[left_1rem_center]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23F0EDE6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="" className="bg-[#0F1623] text-[#F0EDE6]/40">
                    -- اختر السنة الدراسية --
                  </option>
                  {years?.map((year) => (
                    <option
                      key={year.id}
                      value={year.id}
                      className="bg-[#0F1623] text-[#F0EDE6]"
                    >
                      {year.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl border border-white/10 text-[#F0EDE6]/60 text-sm font-semibold hover:border-white/20 hover:text-white transition-all duration-300"
                >
                  إلغاء
                </Link>
                
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 text-[#0F1623] font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  حفظ التغييرات
                </button>
              </div>

            </form>
          </div>

          {/* Subscribed Courses Section */}
          <div className="mt-8 bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <h2 className="text-xl font-bold text-[#F0EDE6] mb-6 text-right flex items-center justify-between">
              <span>الكورسات المشترك بها</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FBBF24]/10 text-[#FBBF24]">
                {subscribedCourses.length} {subscribedCourses.length === 1 ? "كورس" : "كورسات"}
              </span>
            </h2>

            {subscribedCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#F0EDE6]/50 text-sm mb-4">
                  لم تشترك في أي كورس بعد. ابدأ بتصفح الكورسات المتاحة الآن!
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#FBBF24] text-[#0F1623] font-bold text-sm transition-all duration-300 hover:bg-[#FBBF24]/90 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] text-center cursor-pointer"
                >
                  تصفح الكورسات المتاحة
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscribedCourses.map((course: any) => {
                  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";
                  return (
                    <div
                      key={course.id}
                      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0F1623] border border-white/5 hover:border-[#FBBF24]/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#1A2235] flex-shrink-0 flex items-center justify-center">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#F0EDE6]/20 text-lg font-bold">
                              {firstLetter}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <h3 className="text-[#F0EDE6] font-bold text-sm line-clamp-1">
                            {course.title}
                          </h3>
                          {course.description && (
                            <p className="text-[#F0EDE6]/40 text-xs line-clamp-1 mt-0.5">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Link
                        href={`/courses/${course.id}-${slugify(course.title)}`}
                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all duration-300 text-center cursor-pointer"
                      >
                        شاهد الآن
                      </Link>
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
