"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import egyptData from "@/egypt_full.json";

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function RegisterContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    password: "",
    password_confirmation: "",
    governorate_name: "",
    center_name: "",
    parent_phone_number: "",
    current_year_id: ""
  });
  const [availableCenters, setAvailableCenters] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchYears = async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from("years")
          .select("id, title")
          .order("order_index", { ascending: true });
        if (data) {
          setYears(data);
        }
      } catch (err) {
        console.error("Error fetching years", err);
      }
    };
    fetchYears();
  }, []);

  const handleGovernorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gov = e.target.value;
    setFormData({ ...formData, governorate_name: gov, center_name: "" });
    const selectedGov = egyptData.governorates.find((g: any) => g.name_ar === gov);
    setAvailableCenters(selectedGov ? selectedGov.centers : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    // Client-side validation
    const arabicRegex = /^[\u0621-\u064A\s]+$/;
    if (!arabicRegex.test(formData.full_name.trim())) {
      return setError("يجب إدخال الاسم باللغة العربية فقط");
    }
    const nameParts = formData.full_name.trim().split(/\s+/);
    if (nameParts.length < 3) {
      return setError("يجب إدخال الاسم الثلاثي (3 مقاطع على الأقل)");
    }
    if (formData.password.length < 8) {
      return setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }
    if (formData.password !== formData.password_confirmation) {
      return setError("كلمات المرور غير متطابقة");
    }
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      return setError("رقم الهاتف غير صحيح (يجب أن يكون 11 رقماً ويبدأ بـ 01)");
    }
    if (!phoneRegex.test(formData.parent_phone_number)) {
      return setError("رقم هاتف ولي الأمر غير صحيح");
    }
    if (formData.phone === formData.parent_phone_number) {
      return setError("رقم الهاتف لا يمكن أن يكون نفس رقم ولي الأمر");
    }

    setIsLoading(true);
    try {
      const res = await registerUser(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (e: any) {
      setError("حدث خطأ أثناء الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-400/3 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="bg-[#1A2235] rounded-2xl border border-white/10 p-10 shadow-2xl shadow-black/20">
            <div className="flex justify-center mb-4"><CheckIcon /></div>
            <h2 className="text-2xl font-bold text-[#F0EDE6] mb-3">تم إنشاء الحساب بنجاح!</h2>
            <p className="text-[#F0EDE6]/60 text-sm mb-6 leading-relaxed">جاري تسجيل الدخول وتحويلك لحسابك...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col md:flex-row bg-[#0F1623]/80 rounded-3xl border border-[#ffffff14] shadow-2xl overflow-hidden min-h-[600px]">
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image 
                src="/website-logo.png" 
                alt="م/احمد سعد" 
                width={120} 
                height={120} 
                priority 
                className="object-contain mx-auto"
              />
            </Link>
            <h1 className="text-2xl font-bold text-[#F0EDE6] mb-2">إنشاء حساب جديد</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">الاسم الثلاثي</label>
              <input type="text" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">رقم هاتف الطالب</label>
                <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} dir="ltr" placeholder="01xxxxxxxxx" className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white text-right" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">رقم ولي الأمر  </label>
                <input type="tel" required value={formData.parent_phone_number} onChange={e => setFormData({ ...formData, parent_phone_number: e.target.value })} dir="ltr" placeholder="01xxxxxxxxx" className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white text-right" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} dir="ltr" className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F0EDE6]/50 hover:text-[#F0EDE6] transition-colors focus:outline-none">
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input type={showPasswordConfirmation ? "text" : "password"} required value={formData.password_confirmation} onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })} dir="ltr" className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
                  <button type="button" onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F0EDE6]/50 hover:text-[#F0EDE6] transition-colors focus:outline-none">
                    {showPasswordConfirmation ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">المحافظة</label>
                <select required value={formData.governorate_name} onChange={handleGovernorateChange} className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white">
                  <option value="">اختر</option>
                  {egyptData.governorates.map((gov: any) => (
                    <option key={gov.id} value={gov.name_ar}>{gov.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">المركز</label>
                <select required disabled={!formData.governorate_name} value={formData.center_name} onChange={e => setFormData({ ...formData, center_name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white">
                  <option value="">اختر</option>
                  {availableCenters.map((c: any) => (
                    <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-1">السنة الدراسية (الصف)</label>
              <select required value={formData.current_year_id} onChange={e => setFormData({ ...formData, current_year_id: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-[#0F1623] border border-white/10 text-white">
                <option value="">اختر السنة الدراسية</option>
                {years.map((year: any) => (
                  <option key={year.id} value={year.id}>{year.title}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-6 px-4 py-3 rounded-xl bg-amber-500 text-[#0F1623] font-bold text-sm hover:bg-amber-400 transition-all">
              {isLoading ? "جاري الإنشاء..." : "إنشاء حساب"}
            </button>
          </form>

          <p className="text-center text-sm text-[#F0EDE6]/60 mt-4">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              تسجيل الدخول
            </Link>
          </p>
        </div>

        <div className="hidden md:block w-full md:w-1/2 relative bg-[#1A2235]">
          <Image src="/login-image-3.jpeg" alt="إنشاء حساب جديد" fill className="object-cover" priority />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1623]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
