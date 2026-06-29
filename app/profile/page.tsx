"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import ProfileForm from "./ProfileForm";
import { useSearchParams } from "next/navigation";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  
  const [profile, setProfile] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
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
    
    const fetchProfileData = async () => {
      const supabase = createClient();
      
      try {
        const [profileResult, yearsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          supabase
            .from("years")
            .select("id, title")
            .order("order_index", { ascending: true })
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
          localStorage.setItem("current_user", JSON.stringify(profileResult.data));
        }

        if (yearsResult.data) {
          setYears(yearsResult.data);
        }
      } catch (err) {
        console.error("Error fetching profile data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
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

      <main className="min-h-screen pt-28 pb-16 bg-[#0F1623] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#F0EDE6] mb-2 tracking-tight">
              الملف الشخصي للطالب
            </h1>
            <p className="text-[#F0EDE6]/60 text-sm">
              يمكنك الاطلاع على معلوماتك وتحديثها من هنا
            </p>
          </div>

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

          <div className="bg-[#1A2235]/90 rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/25 backdrop-blur-md">
            <ProfileForm user={profile} profile={profile} years={years} />
          </div>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1623]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
