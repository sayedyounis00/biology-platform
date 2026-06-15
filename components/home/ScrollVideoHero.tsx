"use client";

import { useRef, useEffect, useState } from "react";

interface ScrollVideoHeroProps {
  children: React.ReactNode;
}

export default function ScrollVideoHero({ children }: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setVideoReady(true);
      // Ensure video is paused for manual scrubbing
      video.pause();
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    // If metadata is already loaded
    if (video.readyState >= 1) {
      handleLoaded();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || !videoReady) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const scrollableHeight = container.offsetHeight - window.innerHeight;

        if (scrollableHeight <= 0) return;

        // How far we've scrolled through the pinned container
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

        setScrollProgress(progress);

        // Scrub the video to the current scroll position
        if (video.duration && isFinite(video.duration)) {
          const targetTime = progress * video.duration;
          // Only update if significantly different to avoid jitter
          if (Math.abs(video.currentTime - targetTime) > 0.03) {
            video.currentTime = targetTime;
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initialize

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoReady]);

  // Calculate overlay content opacity — fades in as video progresses
  const overlayOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.3));
  // Video fades out near the end
  const videoOpacity = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.75) / 0.25));

  return (
    <div
      ref={containerRef}
      className="hero-scroll-container"
      style={{
        // Total scrollable height: viewport + extra for scrubbing
        height: "400vh",
        position: "relative",
      }}
    >
      {/* Sticky viewport */}
      <div
        className="hero-sticky"
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Video layer */}
        <div
          className="hero-video-wrapper"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            opacity: videoOpacity,
            transition: "opacity 0.15s ease-out",
          }}
        >
          <video
            ref={videoRef}
            src="/hero-video.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Dark gradient overlaying the video for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(15,22,35,0.3) 0%, rgba(15,22,35,0.5) 50%, rgba(15,22,35,0.85) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Content layer — fades in as user scrolls */}
        <div
          className="hero-content-overlay"
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: overlayOpacity,
            transform: `translateY(${(1 - overlayOpacity) * 40}px)`,
            transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          }}
        >
          {children}
        </div>

        {/* Scroll indicator (shows when at top) */}
        <div
          className="scroll-indicator"
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            opacity: scrollProgress < 0.1 ? 1 : 0,
            transition: "opacity 0.4s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              color: "rgba(240,237,230,0.4)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            مرر للأسفل
          </span>
          <div className="scroll-arrow" />
        </div>
      </div>
    </div>
  );
}
