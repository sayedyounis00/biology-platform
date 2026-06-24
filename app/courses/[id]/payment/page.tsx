import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CopyButton from "@/components/ui/CopyButton";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import PaymentForm from "./PaymentForm";

const WALLET_NUMBER = '01XXXXXXXXX';   // replace with real number
const WHATSAPP_NUMBER = '01XXXXXXXXX'; // replace with real number
const formattedWhatsappNumber = WHATSAPP_NUMBER.startsWith('0') ? '2' + WHATSAPP_NUMBER : WHATSAPP_NUMBER;

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = rawId.split("-").slice(0, 5).join("-");

  const supabaseClient = await createClient();

  let user = null;
  let course: Course;

  try {
    const [userRes, courseRes] = await Promise.all([
      supabaseClient.auth.getUser(),
      supabaseClient
        .from("courses")
        .select("id, title, description, price, is_published")
        .eq("id", id)
        .single()
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
  } catch (e) {
    console.error("Error in parallel fetch Step 1 on payment page:", e);
    notFound();
  }

  // If course is free, redirect back to course page
  if (!course.price || course.price === 0) {
    redirect(`/courses/${rawId}`);
  }

  // Check if user is already enrolled
  let enrollmentData = null;
  try {
    const { data } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrollmentData = data;
  } catch (error) {
    console.error("Error checking enrollment on payment page:", error);
  }

  if (enrollmentData) {
    redirect(`/courses/${rawId}`);
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 min-h-screen pt-28 pb-16 bg-[#0F1623] text-[#F0EDE6] flex items-center justify-center" dir="rtl">
        <div className="w-full max-w-lg px-6 flex flex-col gap-8">

          {/* Section 1 — Order summary card */}
          <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 shadow-xl flex flex-col gap-4 text-right">
            <div>
              <span className="text-[#FBBF24] text-xs font-bold uppercase tracking-widest block mb-1">
                أنت تشترك الآن في:
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-[#F0EDE6] leading-snug">
                {course.title}
              </h2>
              {course.description && (
                <p className="text-[#F0EDE6]/60 text-xs leading-relaxed mt-2 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            <div className="h-px bg-white/10 w-full" />

            <div className="flex items-center justify-between font-semibold flex-row-reverse">
              <span className="text-lg text-[#FBBF24] font-bold">
                {course.price} جنيه مصري
              </span>
              <span className="text-sm text-[#F0EDE6]/80">المبلغ المطلوب</span>

            </div>
          </div>

          {/* Section 2 — Payment instructions card */}
          <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 shadow-xl flex flex-col gap-6 text-right">
            <h3 className="text-lg font-bold text-[#F0EDE6]">
              طريقة الدفع
            </h3>

            {/* Step 1 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#F0EDE6]/90">
                الخطوة الأولى: أرسل {course.price} جنيه إلى رقم المحفظة التالي:
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#0F1623] border border-white/5 rounded-xl px-4 py-3 font-mono text-base font-semibold tracking-wider text-[#FBBF24]" dir="ltr">
                <span>{WALLET_NUMBER}</span>
                <CopyButton value={WALLET_NUMBER} />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#F0EDE6]/90">
                الخطوة الثانية: بعد إرسال المبلغ، افتح واتساب وأرسل لقطة شاشة (Screenshot) لتأكيد التحويل إلى:
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#0F1623] border border-white/5 rounded-xl px-4 py-3 font-mono text-base font-semibold tracking-wider text-[#FBBF24]" dir="ltr">
                <span>{WHATSAPP_NUMBER}</span>
                <a
                  href={`https://wa.me/${formattedWhatsappNumber}?text=${encodeURIComponent('السلام عليكم، قمت بتحويل الاشتراك لكورس: ' + course.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-all text-emerald-400 cursor-pointer flex items-center justify-center"
                  aria-label="Open WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.449 5.49 0 9.951-4.462 9.954-9.957.002-2.661-1.03-5.163-2.905-7.039C16.447 1.73 13.948.69 11.29.69c-5.49 0-9.952 4.462-9.955 9.957-.002 1.834.493 3.63 1.429 5.187l-1.008 3.68 3.77-.99c1.517.828 3.073 1.25 4.531 1.25zM17.56 14.52c-.3-.15-1.77-.874-2.043-.974-.275-.1-.475-.15-.675.15-.2.3-.774.974-.95 1.174-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.17-.3-.018-.46.133-.61.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.493-.51-.675-.52-.172-.007-.368-.009-.565-.009-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.525.715.31 1.273.495 1.71.635.717.228 1.37.195 1.885.118.574-.085 1.77-.724 2.02-1.388.25-.664.25-1.234.175-1.387-.075-.15-.275-.25-.575-.4z"/>
                  </svg>
                </a>
              </div>
            </div>

            <p className="text-xs text-[#F0EDE6]/50 italic leading-normal">
              سيتم تفعيل اشتراكك في الكورس خلال 24 ساعة كحد أقصى بعد تأكيد التحويل.
            </p>
          </div>

          {/* Section 3 — Important note box */}
          <div className="border-r-4 border-[#FBBF24] bg-[#1A2235] rounded-l-2xl p-5 shadow-md text-right">
            <p className="text-sm leading-relaxed text-[#F0EDE6]/90">
              يرجى كتابة اسمك الكامل واسم الكورس في رسالة الواتساب لنسهل عملية تفعيل الاشتراك بسرعة.
            </p>
          </div>

          {/* Section 4 — Complete buying request form */}
          <PaymentForm
            courseId={course.id}
            userId={user.id}
            courseTitle={course.title}
          />

          {/* Back link */}
          <div className="text-center mt-2">
            <Link
              href={`/courses`}
              className="inline-flex items-center gap-1.5 text-sm text-[#F0EDE6]/60 hover:text-[#FBBF24] transition-colors font-medium"
            >
              → العودة إلى الكورس
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
