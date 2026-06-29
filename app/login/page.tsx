"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/auth/actions";

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

function LoginContent() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await loginUser(phone, password);
      
      if (res.error) {
        setError(res.error);
      } else if (res.profile) {
        // Save to localStorage
        localStorage.setItem("current_user", JSON.stringify(res.profile));
        
        // Trigger event so Navbar can update
        window.dispatchEvent(new Event("storage"));
        
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (e: any) {
      setError("حدث خطأ أثناء الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-[#F0EDE6] mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-[#F0EDE6]/60 text-sm">
              مرحباً بك مجدداً! سجّل دخولك للمتابعة
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-2">رقم هاتف الطالب</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#F0EDE6]/70 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-[#F0EDE6] placeholder-[#F0EDE6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#F0EDE6]/50 hover:text-[#F0EDE6] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-4 py-4 rounded-xl bg-amber-500 text-[#0F1623] font-bold text-sm hover:bg-amber-400 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-sm text-[#F0EDE6]/60 mt-6">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>

        <div className="hidden md:block w-full md:w-1/2 relative bg-[#1A2235]">
          <Image
            src="/login-image-3.jpeg"
            alt="تسجيل الدخول"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1623]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
