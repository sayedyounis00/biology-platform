"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/assets/website-logo.png";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/app/auth/actions";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Check localStorage for manual session
    const loadUserFromStorage = () => {
      const userStr = localStorage.getItem("current_user");
      if (userStr) {
        try {
          setProfile(JSON.parse(userStr));
        } catch (e) {
          localStorage.removeItem("current_user");
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    loadUserFromStorage();
    
    // Listen for storage events (e.g. login from another tab, or login page push)
    window.addEventListener("storage", loadUserFromStorage);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("storage", loadUserFromStorage);
    };
  }, []);

  const handleSignOut = async () => {
    // 1. Clear local storage
    localStorage.removeItem("current_user");
    
    // 2. Clear cookie
    await logoutUser();
    
    // 3. Update state
    setProfile(null);
    
    // 4. Fire storage event and redirect
    window.dispatchEvent(new Event("storage"));
    router.push("/");
    router.refresh();
  };

  const displayName = profile?.full_name || "طالب";

  return (
    <nav
      id="main-nav"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0F1623]/80 backdrop-blur-md border-b border-[#ffffff14]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center">
          <Image
            src={logo}
            alt="احمد سعد"
            width={150}
            height={50}
            className="w-15 md:w-35 h-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {profile ? (
            <Link
              href="/profile"
              className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
            >
              الملف الشخصي
            </Link>
          ) : (
            <div></div>
          )}

          {!loading && (
            <>
              {profile ? (
                <div className="flex items-center gap-4">
                  <span className="text-[#F0EDE6]/80 text-sm font-medium bg-[#1A2235] px-3.5 py-1.5 rounded-full border border-white/5">
                    مرحباً، {displayName}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-[#F0EDE6]/60 text-sm font-medium hover:text-red-400 transition-colors cursor-pointer"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="text-[#FFFFF]/60 text-lg font-bold hover:text-[#F0EDE6] transition-colors"
                  >
                    أنشئ حساب
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FBBF24] text-[#0F1623] text-sm font-bold hover:bg-[#F59E0B] transition-colors"
                  >
                    تسجيل الدخول
                    <span aria-hidden="true" className="mr-1">←</span>
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <button
          id="mobile-menu-toggle"
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={cn("block w-5 h-0.5 bg-[#F0EDE6] transition-all duration-300", mobileOpen && "rotate-45 translate-y-[4px]")} />
          <span className={cn("block w-5 h-0.5 bg-[#F0EDE6] transition-all duration-300", mobileOpen && "-rotate-45 -translate-y-[4px]")} />
        </button>
      </div>

      <div className={cn("md:hidden overflow-hidden transition-all duration-300", mobileOpen ? "max-h-64 border-b border-[#ffffff14]" : "max-h-0")}>
        <div className="bg-[#0F1623]/95 backdrop-blur-md px-6 py-6 flex flex-col gap-4">
          {profile ? (
            <Link
              href="/profile"
              className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              الملف الشخصي
            </Link>
          ) : (
            <Link
              href="/courses"
              className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              الدورات
            </Link>
          )}

          {!loading && (
            <>
              {profile ? (
                <>
                  <span className="text-[#F0EDE6]/80 text-sm font-medium py-1">
                    مرحباً، {displayName}
                  </span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="text-right text-red-400 text-sm font-medium transition-colors cursor-pointer"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FBBF24] text-[#0F1623] text-sm font-bold hover:bg-[#F59E0B] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    ابدأ الآن ←
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
