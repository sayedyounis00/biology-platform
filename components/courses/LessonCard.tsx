import type { Lesson } from "@/types";

interface LessonCardProps {
  lesson: Lesson;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  return (
    <div
      id={`lesson-card-${lesson.id}`}
      className="group relative rounded-xl bg-[#1A2235] border border-[#ffffff14] p-5 transition-all duration-300 hover:border-[#FBBF24]/50 hover:shadow-[0_0_25px_rgba(251,191,36,0.06)]"
    >
      <div className="flex flex-col gap-2">
        {/* Lesson Name */}
        <h3 className="text-[#F0EDE6] font-bold text-lg leading-snug group-hover:text-[#FBBF24] transition-colors">
          {lesson.title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[#F0EDE6]/40 mt-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs font-mono">
            {new Date(lesson.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

