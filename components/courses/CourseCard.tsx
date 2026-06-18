import Link from "next/link";
import type { Course } from "@/types";
import { slugify } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  isLoggedIn?: boolean;
}

export default function CourseCard({ course, isLoggedIn }: CourseCardProps) {
  const isFree = !course.price || course.price === 0;
  const firstLetter = course.title?.charAt(0)?.toUpperCase() ?? "C";

  return (
    <div
      id={`course-card-${course.id}`}
      className="group flex flex-col rounded-2xl bg-[#1A2235] border border-[#ffffff14] overflow-hidden transition-all duration-300 hover:border-[#FBBF24]/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.06)]"
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden bg-[#0F1623]">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-[#FBBF24] text-[#0F1623] font-bold text-sm transition-all duration-300 hover:bg-[#FBBF24]/90 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] text-center"
          >
            {isFree ? "شاهد الدروس" : "اشترك الآن"}
          </Link>
        </div>
      </div>
    </div>
  );
}


