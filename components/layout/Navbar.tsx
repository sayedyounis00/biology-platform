"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="font-gravity font-bold text-lg"
        >
          احمد سعد
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/courses"
            className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
          >
            الدورات
          </Link>
          <Link
            href="/login"
            className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FBBF24] text-[#0F1623] text-sm font-bold hover:bg-[#F59E0B] transition-colors"
          >
            ابدأ الآن
            <span aria-hidden="true" className="mr-1">←</span>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span
            className={cn(
              "block w-5 h-0.5 bg-[#F0EDE6] transition-all duration-300",
              mobileOpen && "rotate-45 translate-y-[4px]"
            )}
          />
          <span
            className={cn(
              "block w-5 h-0.5 bg-[#F0EDE6] transition-all duration-300",
              mobileOpen && "-rotate-45 -translate-y-[4px]"
            )}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-64 border-b border-[#ffffff14]" : "max-h-0"
        )}
      >
        <div className="bg-[#0F1623]/95 backdrop-blur-md px-6 py-6 flex flex-col gap-4">
          <Link
            href="/courses"
            className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            الدورات
          </Link>
          <Link
            href="/login"
            className="text-[#F0EDE6]/60 text-sm font-medium hover:text-[#F0EDE6] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FBBF24] text-[#0F1623] text-sm font-bold hover:bg-[#F59E0B] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            ابدأ الآن ←
          </Link>
        </div>
      </div>
    </nav>
  );
}
