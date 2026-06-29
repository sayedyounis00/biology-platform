"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { updateProfileManual } from "@/app/auth/actions";
import egyptData from "@/egypt_full.json";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  user,
  profile,
  years,
}: {
  user: any;
  profile: any;
  years: any[];
}) {
  const [governorate, setGovernorate] = useState(profile?.governorate_name || "");
  const [center, setCenter] = useState(profile?.center_name || "");
  const [availableCenters, setAvailableCenters] = useState<any[]>([]);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [parentPhone, setParentPhone] = useState(profile?.parent_phone_number || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Validate that parent phone is not the same as student phone
  useEffect(() => {
    const parentPhoneInput = document.getElementById("parentPhone") as HTMLInputElement;
    if (parentPhoneInput) {
      if (phone && parentPhone && phone === parentPhone) {
        parentPhoneInput.setCustomValidity("رقم ولي الأمر لا يمكن أن يكون نفس رقم الطالب");
      } else {
        parentPhoneInput.setCustomValidity("");
      }
    }
  }, [phone, parentPhone]);

  // Update available centers when governorate changes
  useEffect(() => {
    if (governorate) {
      const selectedGov = egyptData.governorates.find(
        (g: any) => g.name_ar === governorate
      );
      setAvailableCenters(selectedGov ? selectedGov.centers : []);

      // Reset center if it doesn't exist in the new governorate
      if (
        selectedGov &&
        !selectedGov.centers.find((c: any) => c.name_ar === center)
      ) {
        setCenter("");
      }
    } else {
      setAvailableCenters([]);
      setCenter("");
    }
  }, [governorate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    
    // Client-side validation for Arabic Tripartite name
    const arabicRegex = /^[\u0621-\u064A\s]+$/;
    if (!arabicRegex.test(fullName.trim())) {
      setIsLoading(false);
      return router.push(`/profile?error=${encodeURIComponent("يجب إدخال الاسم باللغة العربية فقط")}`);
    }
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 3) {
      setIsLoading(false);
      return router.push(`/profile?error=${encodeURIComponent("يجب إدخال الاسم الثلاثي (3 مقاطع على الأقل)")}`);
    }

    const data = {
      fullName,
      phone: formData.get("phone") as string,
      parentPhone: formData.get("parentPhone") as string,
      governorate: formData.get("governorate") as string,
      center: formData.get("center") as string,
      currentYearId: formData.get("currentYearId") as string,
    };

    try {
      const res = await updateProfileManual(user?.id, data);
      if (res.error) {
        router.push(`/profile?error=${encodeURIComponent(res.error)}`);
      } else if (res.profile) {
        // Update local storage
        localStorage.setItem("current_user", JSON.stringify(res.profile));
        window.dispatchEvent(new Event("storage"));
        router.push(`/profile?success=true`);
      }
    } catch (err: any) {
      router.push(`/profile?error=${encodeURIComponent("حدث خطأ أثناء التحديث")}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
        >
          الاسم الثلاثي
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          pattern="^([a-zA-Z\u0600-\u06FF]+\s+){2,}[a-zA-Z\u0600-\u06FF]+.*$"
          title="الرجاء إدخال الاسم الثلاثي باللغه العربيه"
          defaultValue={profile?.full_name || user?.user_metadata?.full_name || ""}
          placeholder="أدخل اسمك الثلاثي"
          className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 text-right"
          dir="rtl"
        />
      </div>



      {/* Grid: Phone & Parent Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
          >
            رقم الهاتف
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 text-right"
            dir="ltr"
          />
        </div>

        <div>
          <label
            htmlFor="parentPhone"
            className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
          >
            رقم ولي الأمر
          </label>
          <input
            id="parentPhone"
            name="parentPhone"
            type="tel"
            required
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 text-right"
            dir="ltr"
          />
        </div>
      </div>

      {/* Grid: Governorate & Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="governorate"
            className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
          >
            المحافظة
          </label>
          <select
            id="governorate"
            name="governorate"
            required
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 appearance-none text-right bg-no-repeat bg-[left_1rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23F0EDE6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundSize: "1.25rem",
            }}
            dir="rtl"
          >
            <option value="" className="bg-[#0F1623] text-[#F0EDE6]/40">
              -- اختر المحافظة --
            </option>
            {egyptData.governorates.map((gov) => (
              <option
                key={gov.id}
                value={gov.name_ar}
                className="bg-[#0F1623] text-[#F0EDE6]"
              >
                {gov.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="center"
            className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
          >
            المركز / المنطقة
          </label>
          <select
            id="center"
            name="center"
            required
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            disabled={!governorate}
            className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 appearance-none text-right bg-no-repeat bg-[left_1rem_center] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23F0EDE6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundSize: "1.25rem",
            }}
            dir="rtl"
          >
            <option value="" className="bg-[#0F1623] text-[#F0EDE6]/40">
              -- اختر المركز --
            </option>
            {availableCenters.map((c) => (
              <option
                key={c.id}
                value={c.name_ar}
                className="bg-[#0F1623] text-[#F0EDE6]"
              >
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Year & Student ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="currentYearId"
            className="block text-sm font-medium text-[#F0EDE6]/70 mb-2 text-right"
          >
            السنة الدراسية / الصف
          </label>
          <select
            id="currentYearId"
            name="currentYearId"
            required
            defaultValue={profile?.current_year_id || ""}
            className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 appearance-none text-right bg-no-repeat bg-[left_1rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23F0EDE6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundSize: "1.25rem",
            }}
            dir="rtl"
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

        <div>
          <label
            htmlFor="studentId"
            className="block text-sm font-medium text-[#F0EDE6]/40 mb-2 text-right"
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
          disabled={isLoading}
          className="px-8 py-3 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 text-[#0F1623] font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}
