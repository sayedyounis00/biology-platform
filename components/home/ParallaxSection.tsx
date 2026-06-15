"use client";

import { useRef, useEffect, useState, type CSSProperties } from "react";

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Parallax speed factor: negative = moves slower than scroll (depth), positive = faster */
  speed?: number;
  /** Direction of the parallax reveal animation */
  direction?: "up" | "left" | "right";
  style?: CSSProperties;
}

export default function ParallaxSection({
  children,
  className = "",
  id,
  speed = -0.15,
  direction = "up",
  style,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const rafRef = useRef<number>(0);

  // Intersection Observer for reveal animation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Only apply parallax when element is in viewport
        if (rect.bottom >= 0 && rect.top <= windowHeight) {
          const centerOffset =
            (rect.top + rect.height / 2 - windowHeight / 2) * speed;
          setParallaxY(centerOffset);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  // Calculate initial transform for reveal animation
  const getInitialTransform = () => {
    if (isVisible) return `translateY(${parallaxY}px)`;
    switch (direction) {
      case "up":
        return `translateY(${60 + parallaxY}px)`;
      case "left":
        return `translateX(60px) translateY(${parallaxY}px)`;
      case "right":
        return `translateX(-60px) translateY(${parallaxY}px)`;
      default:
        return `translateY(${60 + parallaxY}px)`;
    }
  };

  return (
    <div
      ref={sectionRef}
      id={id}
      className={`parallax-section ${isVisible ? "parallax-visible" : ""} ${className}`}
      style={{
        ...style,
        transform: getInitialTransform(),
        opacity: isVisible ? 1 : 0,
        transition:
          "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
