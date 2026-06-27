import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/types";
import { slugify } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  isLoggedIn?: boolean;
  isEnrolled?: boolean;
}

export default function CourseCard({ course, isLoggedIn, isEnrolled }: CourseCardProps) {
  const isFree = !course.price || course.price === 0;
  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";
  const hasAccess = isFree || isEnrolled;

  return (
    <div
      id={`course-card-${course.id}`}
      className="group flex flex-col rounded-2xl bg-[#1A2235] border border-[#ffffff14] overflow-hidden transition-all duration-300 hover:border-[#FBBF24]/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.06)]"
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden bg-[#0F1623]">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#F0EDE6]/10 text-7xl font-bold select-none">
              {firstLetter}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
        <div className="flex flex-col gap-3">
          <h3 className="text-[#F0EDE6] font-bold text-base leading-snug transition-colors line-clamp-2">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-[#F0EDE6]/50 text-sm leading-relaxed line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="pt-1">
            {isFree ? (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                مجاني
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FBBF24]/15 text-[#FBBF24]">
                {course.price} EGP
              </span>
            )}
          </div>
        </div>

        {/* Enroll Button */}
        <div className="pt-2">
          <Link
            href={isLoggedIn ? `/courses/${course.id}-${slugify(course.title)}` : "/register"}
            className={`flex items-center justify-center w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 text-center ${
              hasAccess
                ? "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : "bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0F1623] hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            }`}
          >
            {hasAccess ? "شاهد الآن" : "اشترك الآن"}
          </Link>
        </div>
      </div>
    </div>
  );
}


