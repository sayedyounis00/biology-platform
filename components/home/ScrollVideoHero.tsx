"use client";

import Image from "next/image";

interface ScrollVideoHeroProps {
  children: React.ReactNode;
}

export default function ScrollVideoHero({ children }: ScrollVideoHeroProps) {
  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#0F1623]"
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/brin-dotted.jpeg"
          alt="منصة الأحياء"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark gradient overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(15,22,35,0.4) 0%, rgba(15,22,35,0.6) 50%, rgba(15,22,35,0.9) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full flex items-center justify-center py-20">
        {children}
      </div>
    </div>
  );
}
