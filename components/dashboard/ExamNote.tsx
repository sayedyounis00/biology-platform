"use client";

import { useState } from "react";

export default function ExamNote({ exam }: { exam?: any }) {
  const [isSent, setIsSent] = useState(false);

  if (!exam) return null;

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      // For Supabase storage, adding ?download= forces the backend to send Content-Disposition: attachment
      // If it's already got query params, we append &download=
      const url = new URL(exam.exam_url);
      url.searchParams.set('download', 'true');
      
      const a = document.createElement('a');
      a.href = url.toString();
      a.download = exam.title || 'exam';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error with download:", error);
      window.open(exam.exam_url, '_blank');
    }
  };

  return (
    <div className="mb-8 bg-[#2A364D]/60 border border-[#C0E838]/30 rounded-xl p-6 text-[#F0EDE6] flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start md:items-center gap-4">
        <div className="p-3 rounded-lg bg-[#C0E838]/10 text-[#C0E838] shrink-0 mt-1 md:mt-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#C0E838] mb-1">{exam.title}</h3>
          <p className="text-base font-medium leading-relaxed">
            قم بتحميل الامتحان المرفق (<a href={exam.exam_url} onClick={handleDownload} className="underline hover:text-white text-emerald-400 cursor-pointer">تحميل من هنا</a>) وارسال حله إلى <span className="font-bold text-[#C0E838] px-1" dir="ltr">01143825523</span>، ثم اضغط على زر "تم الارسال" لتأكيد ارسالك للامتحان.
          </p>
        </div>
      </div>
      <button 
        onClick={() => setIsSent(true)}
        disabled={isSent}
        className={`whitespace-nowrap px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-md ${
          isSent 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed" 
            : "bg-[#C0E838] text-[#0F1623] hover:bg-[#b0d530] hover:shadow-[0_0_20px_rgba(192,232,56,0.3)] cursor-pointer"
        }`}
      >
        {isSent ? "تم التأكيد ✓" : "تم الارسال"}
      </button>
    </div>
  );
}
