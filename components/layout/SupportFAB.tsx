"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, X, Phone, User, Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitComplaint } from "@/app/actions/support";
import { cn } from "@/lib/utils";

// Cookie helpers
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.46 3.473 1.332 4.988l-1.417 5.178 5.3-.1.144-.08c1.554.922 3.327 1.414 5.14 1.415a9.98 9.98 0 0 0 9.988-9.988c0-5.506-4.483-9.988-9.988-9.988zm6.059 13.916c-.247.7-1.436 1.36-1.986 1.455-.49.085-1.13.155-3.272-.733-2.731-1.134-4.493-3.91-4.63-4.09-.136-.18-1.11-1.48-1.11-2.81 0-1.332.68-1.988.948-2.257.267-.267.587-.333.784-.333.196 0 .393.003.565.01.18.007.42-.069.658.504.246.593.842 2.057.915 2.203.072.146.12.316.023.51-.097.196-.145.316-.29.488-.146.17-.308.38-.44.51-.146.143-.3.3-.128.594.17.294.757 1.25 1.624 2.022.868.773 1.602 1.01 1.83 1.133.228.125.362.106.496-.05.134-.155.578-.675.733-.907.156-.232.31-.194.523-.115.213.08 1.353.64 1.587.757.234.118.39.176.446.275.056.097.056.565-.19 1.266z" />
  </svg>
);

export default function SupportFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [showManualInputs, setShowManualInputs] = useState(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);

  // Detect clicks outside to close the support window
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        windowRef.current &&
        !windowRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("#support-fab-btn")
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load user information on mount and check cookies
  useEffect(() => {
    const supabase = createClient();

    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          // Query the profiles table for name and phone
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            const profileName = profile.full_name || user.user_metadata?.full_name || "";
            const profilePhone = profile.phone || "";
            
            if (profileName) setName(profileName);
            if (profilePhone) setPhone(profilePhone);
            
            // If we have both name and phone, hide manual inputs
            if (profileName && profilePhone) {
              setShowManualInputs(false);
            }
          } else {
            // Logged in but no profile record yet, fall back to auth user info
            const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
            if (fallbackName) setName(fallbackName);
          }
        } else {
          // Not logged in, check cookies
          const cookieName = getCookie("support_user_name");
          const cookiePhone = getCookie("support_phone_number");
          
          if (cookieName) setName(cookieName);
          if (cookiePhone) setPhone(cookiePhone);
          
          if (cookieName && cookiePhone) {
            setShowManualInputs(false);
          }
        }
      } catch (err) {
        console.error("Error loading user profile in Support FAB:", err);
      } finally {
        setProfileLoaded(true);
      }
    };

    fetchUserProfile();

    // Listen for auth state changes to keep profile updated
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchUserProfile();
        } else {
          setIsLoggedIn(false);
          // Load cookies on sign out
          const cookieName = getCookie("support_user_name");
          const cookiePhone = getCookie("support_phone_number");
          setName(cookieName || "");
          setPhone(cookiePhone || "");
          setShowManualInputs(!(cookieName && cookiePhone));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    
    // Determine which name/phone to send
    let submittedName = name.trim();
    let submittedPhone = phone.trim();

    if (showManualInputs) {
      const form = e.currentTarget;
      submittedName = (form.elements.namedItem("userName") as HTMLInputElement).value.trim();
      submittedPhone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    }

    formData.append("complaintText", complaintText);
    formData.append("userName", submittedName);
    formData.append("phone", submittedPhone);

    const result = await submitComplaint(null, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setComplaintText("");
      setLoading(false);
      
      // Save name/phone to cookies if they were typed manually (not logged in)
      if (!isLoggedIn) {
        setCookie("support_user_name", submittedName);
        setCookie("support_phone_number", submittedPhone);
        setName(submittedName);
        setPhone(submittedPhone);
        setShowManualInputs(false);
      }

      // Close the modal after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 3000);
    }
  };

  if (!profileLoaded) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="fixed left-6 bottom-6 z-50" dir="rtl">
        <a
          href="https://wa.me/201143825523"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-108 hover:shadow-[0_0_20px_rgba(37,211,102,0.6)] active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-[#0F1623]"
          aria-label="تواصل معنا عبر واتساب"
        >
          <WhatsAppIcon className="w-8 h-8" />
        </a>
      </div>
    );
  }

  return (
    <div className="fixed left-6 bottom-6 z-50 font-sans" dir="rtl">
      {/* Floating Action Button */}
      <button
        id="support-fab-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-[#0F1623] flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-108 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0F1623]",
          isOpen && "rotate-90 bg-red-500 from-red-500 to-red-600 text-white"
        )}
        aria-label="تواصل مع الدعم الفني"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6 animate-pulse-slow" />
        )}
      </button>

      {/* Floating Chat/Support Window */}
      {isOpen && (
        <div
          ref={windowRef}
          className="absolute left-0 bottom-18 w-[350px] max-w-[calc(100vw-2rem)] bg-[#1A2235]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-[#0F1623]/80 px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-sm font-bold text-[#F0EDE6] tracking-wide">الدعم الفني والشكاوى</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#F0EDE6]/50 hover:text-white hover:bg-white/5 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5">
            {success ? (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <p className="text-emerald-400 font-bold text-sm">تم إرسال شكواك بنجاح!</p>
                <p className="text-xs text-[#F0EDE6]/60 leading-relaxed">
                  تم تسجيل المشكلة في قاعدة البيانات، وسنقوم بالتواصل معك على رقم هاتفك لحل المشكلة في أقرب وقت.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User details header (if cookies or profile data exists) */}
                {profileLoaded && !showManualInputs && (name || phone) && (
                  <div className="p-3 bg-[#0F1623]/60 rounded-xl border border-white/5 text-xs text-[#F0EDE6]/80 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-amber-400">بيانات الاتصال المستخدمة:</span>
                      <button
                        type="button"
                        onClick={() => setShowManualInputs(true)}
                        className="text-amber-500 hover:text-amber-400 font-bold transition-colors cursor-pointer underline text-[10px]"
                      >
                        تعديل البيانات
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[#F0EDE6]/70">
                      <User className="w-3.5 h-3.5" />
                      <span>{name || "غير محدد"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#F0EDE6]/70" dir="ltr">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-right w-full">{phone || "غير محدد"}</span>
                    </div>
                  </div>
                )}

                {/* Manual contact details inputs */}
                {profileLoaded && showManualInputs && (
                  <div className="space-y-3 animate-in slide-in-from-top-3 duration-250">
                    <div>
                      <label htmlFor="support-name" className="block text-xs font-semibold text-[#F0EDE6]/70 mb-1.5">
                        الاسم بالكامل
                      </label>
                      <div className="relative">
                        <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0EDE6]/40" />
                        <input
                          id="support-name"
                          name="userName"
                          type="text"
                          required
                          defaultValue={name}
                          placeholder="مثال: أحمد محمد علي"
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#0F1623] border border-white/10 text-sm text-[#F0EDE6] placeholder-[#F0EDE6]/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="support-phone" className="block text-xs font-semibold text-[#F0EDE6]/70 mb-1.5">
                        رقم الهاتف للتواصل
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0EDE6]/40" />
                        <input
                          id="support-phone"
                          name="phone"
                          type="tel"
                          required
                          defaultValue={phone}
                          placeholder="01xxxxxxxxx"
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#0F1623] border border-white/10 text-sm text-[#F0EDE6] placeholder-[#F0EDE6]/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 text-right"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Back link to show prefilled state if it was toggled */}
                    {!isLoggedIn && getCookie("support_user_name") && (
                      <button
                        type="button"
                        onClick={() => setShowManualInputs(false)}
                        className="text-[10px] text-[#F0EDE6]/50 hover:text-[#F0EDE6] underline block cursor-pointer"
                      >
                        العودة للبيانات المحفوظة
                      </button>
                    )}
                  </div>
                )}

                {/* Problem details textarea */}
                <div>
                  <label htmlFor="support-text" className="block text-xs font-semibold text-[#F0EDE6]/70 mb-1.5">
                    تفاصيل المشكلة أو الاستفسار
                  </label>
                  <textarea
                    id="support-text"
                    name="complaintText"
                    required
                    rows={4}
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="اكتب تفاصيل مشكلتك هنا بالتفصيل لنتمكن من مساعدتك..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0F1623] border border-white/10 text-sm text-[#F0EDE6] placeholder-[#F0EDE6]/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 resize-none leading-relaxed"
                  />
                </div>

                {/* Error Box */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:bg-[#FBBF24]/50 disabled:cursor-not-allowed text-[#0F1623] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 transform rotate-180" />
                      <span>إرسال الشكوى</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
