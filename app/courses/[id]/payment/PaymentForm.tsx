"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock, Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentFormProps {
  courseId: string;
  userId: string;
  courseTitle: string;
}

export default function PaymentForm({ courseId, userId, courseTitle }: PaymentFormProps) {
  const [status, setStatus] = useState<"none" | "pending" | "approved" | "rejected" | "loading">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkRequestStatus() {
      try {
        const { data, error } = await supabase
          .from("course_requests")
          .select("status")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching request status:", error);
          setStatus("none");
          return;
        }

        if (data) {
          setStatus(data.status as any);
        } else {
          setStatus("none");
        }
      } catch (err) {
        console.error("Error:", err);
        setStatus("none");
      }
    }

    checkRequestStatus();
  }, [courseId, userId, supabase]);

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from("course_requests")
        .upsert({
          user_id: userId,
          course_id: courseId,
          status: "pending"
        }, { onConflict: "user_id,course_id" });

      if (error) {
        setErrorMessage("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
      } else {
        setStatus("pending");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("عذراً، حدث خطأ غير متوقع. يرجى التحقق من اتصالك بالإنترنت.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 shadow-xl flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#FBBF24] animate-spin" />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="rounded-2xl bg-[#1A2235] border border-emerald-500/30 p-6 shadow-xl flex flex-col gap-4 text-right animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-400">تم إرسال طلب التفعيل بنجاح</h4>
            <p className="text-xs text-[#F0EDE6]/50 mt-0.5">طلبك قيد المراجعة حالياً من قبل الإدارة</p>
          </div>
        </div>
        <div className="h-px bg-white/10 w-full" />
        <p className="text-sm leading-relaxed text-[#F0EDE6]/80">
          لقد استلمنا طلب الاشتراك الخاص بك لكورس <span className="font-bold text-[#FBBF24]">{courseTitle}</span>. سيقوم الأستاذ بمراجعة التحويل وتفعيل الكورس لك خلال 24 ساعة كحد أقصى.
        </p>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="rounded-2xl bg-[#1A2235] border border-amber-500/30 p-6 shadow-xl flex flex-col gap-4 text-right">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-400">تم تفعيل الكورس بالفعل!</h4>
            <p className="text-xs text-[#F0EDE6]/50 mt-0.5">يمكنك البدء في مشاهدة المحاضرات الآن</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-all cursor-pointer"
        >
          الانتقال إلى الكورس
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 shadow-xl flex flex-col gap-5 text-right animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-lg font-bold text-[#F0EDE6] flex items-center gap-2 flex-row-reverse">
        <CreditCard className="w-5 h-5 text-[#FBBF24]" />
        إتمام عملية الشراء
      </h3>
      
      <p className="text-sm leading-relaxed text-[#F0EDE6]/80">
        بعد إرسال الأموال عن طريق المحفظة الإلكترونية وإرسال رسالة التأكيد عبر واتساب، يرجى الضغط على الزر أدناه لإرسال طلب تفعيل الكورس للإدارة.
      </p>

      {status === "rejected" && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
          لقد تم رفض طلبك السابق لتفعيل هذا الكورس. يرجى التأكد من تحويل المبلغ بشكل صحيح والتواصل مع الدعم الفني، ثم يمكنك إرسال طلب جديد بالضغط على الزر أدناه.
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleSubmitRequest}
        disabled={submitting}
        className="w-full py-3.5 px-4 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:bg-[#FBBF24]/50 disabled:cursor-not-allowed text-slate-950 font-bold tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري إرسال الطلب...</span>
          </>
        ) : (
          <span>تأكيد وإرسال طلب تفعيل الكورس</span>
        )}
      </button>
    </div>
  );
}
