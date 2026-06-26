"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Circle, Check, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Maximize, Minimize, Settings, FileText, Download, ChevronDown } from "lucide-react";
import { toggleLessonCompleteAction, markLessonCompleteAction } from "@/app/courses/actions";
import type { Course, Lesson } from "@/types";

interface LessonViewerProps {
  course: Course;
  lesson: Lesson;
  allLessons: Lesson[];
  initialCompletedLessonIds: string[];
  userId: string;
  rawId: string;
  encodedVideoUrl: string;
}

// Helpers to extract embed URLs
function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  let videoId = "";
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
  } catch (e) {
    console.error("Error parsing youtube URL", e);
  }
  if (videoId) {
    // Enable JS API and force autoplay + mute for browser policy compatibility
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&rel=0&controls=0&disablekb=1&modestbranding=1`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  let videoId = "";
  try {
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (match) {
      videoId = match[1];
    }
  } catch (e) {
    console.error("Error parsing vimeo URL", e);
  }
  if (videoId) {
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&controls=0`;
  }
  return null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// localStorage helper — keyed per course+user so data is isolated
// Stores { completed: string[], removed: string[] }
// 'completed' = IDs the user marked complete
// 'removed' = IDs the user explicitly un-completed (so server data doesn't re-add them)
function getStorageKey(courseId: string, userId: string) {
  return `lesson_progress_${courseId}_${userId}`;
}

interface LocalProgress {
  completed: string[];
  removed: string[];
}

function readLocalProgress(courseId: string, userId: string): LocalProgress {
  try {
    const raw = localStorage.getItem(getStorageKey(courseId, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      // Handle legacy format (plain array) gracefully
      if (Array.isArray(parsed)) {
        return { completed: parsed, removed: [] };
      }
      return parsed as LocalProgress;
    }
  } catch { /* ignore */ }
  return { completed: [], removed: [] };
}

function writeLocalProgress(courseId: string, userId: string, data: LocalProgress) {
  try {
    localStorage.setItem(getStorageKey(courseId, userId), JSON.stringify(data));
  } catch { /* ignore */ }
}

export default function LessonViewer({
  course,
  lesson,
  allLessons,
  initialCompletedLessonIds,
  userId,
  rawId,
  encodedVideoUrl,
}: LessonViewerProps) {
  // Build the completed set by merging server data + localStorage,
  // while respecting explicitly-removed IDs from localStorage
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(initialCompletedLessonIds);
    const local = readLocalProgress(course.id, userId);
    const removedSet = new Set(local.removed);
    // Start with server IDs, filter out ones the user explicitly un-completed
    const merged = new Set<string>(
      initialCompletedLessonIds.filter(id => !removedSet.has(id))
    );
    // Add locally-cached completed IDs
    for (const id of local.completed) merged.add(id);
    return merged;
  });

  // When server props update (navigation between lessons), re-merge
  useEffect(() => {
    setCompletedIds(prev => {
      const local = readLocalProgress(course.id, userId);
      const removedSet = new Set(local.removed);
      const merged = new Set<string>(
        initialCompletedLessonIds.filter(id => !removedSet.has(id))
      );
      for (const id of local.completed) merged.add(id);
      // Also keep anything already in state
      for (const id of prev) {
        if (!removedSet.has(id)) merged.add(id);
      }
      // Persist back
      writeLocalProgress(course.id, userId, {
        completed: Array.from(merged),
        removed: local.removed,
      });
      return merged;
    });
  }, [initialCompletedLessonIds, course.id, userId]);

  // Custom Video Controller State
  const [isPlaying, setIsPlaying] = useState(true); // Default to true since it autoplays
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Default to muted to allow autoplay
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState<"480" | "720">("720");
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsToast, setShowFsToast] = useState(false);

  // Decode the video URL on the client to obfuscate it in source inspect
  const [decodedVideoUrl, setDecodedVideoUrl] = useState("");
  useEffect(() => {
    if (encodedVideoUrl) {
      try {
        setDecodedVideoUrl(window.atob(encodedVideoUrl));
      } catch (e) {
        console.error("Error decoding video URL", e);
      }
    } else {
      setDecodedVideoUrl("");
    }
  }, [encodedVideoUrl]);

  const youtubeUrl = getYoutubeEmbedUrl(decodedVideoUrl);
  const vimeoUrl = getVimeoEmbedUrl(decodedVideoUrl);
  const isDirectVideo = decodedVideoUrl && !youtubeUrl && !vimeoUrl;

  const isCurrentCompleted = completedIds.has(lesson.id);

  // Anti-Inspect security measures to deter regular students
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "i" || e.key === "j" || e.key === "c")) {
        e.preventDefault();
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ── Toggle completion (manual button click) ──
  const handleToggleComplete = async (targetId: string) => {
    const wasCompleted = completedIds.has(targetId);
    const updated = new Set(completedIds);
    const local = readLocalProgress(course.id, userId);
    const removedSet = new Set(local.removed);

    if (wasCompleted) {
      updated.delete(targetId);
      // Track as explicitly removed so merge won't re-add from server
      removedSet.add(targetId);
    } else {
      updated.add(targetId);
      // No longer "removed" — clear from removed list
      removedSet.delete(targetId);
    }

    // 1. Persist to localStorage FIRST (instant, survives re-renders)
    setCompletedIds(updated);
    writeLocalProgress(course.id, userId, {
      completed: Array.from(updated),
      removed: Array.from(removedSet),
    });

    // 2. Send to server in the background
    try {
      const res = await toggleLessonCompleteAction(targetId, wasCompleted);
      if (!res.success) {
        console.error("Server toggle failed:", res.error);
      } else {
        // Server succeeded — we can clear this ID from the removed list
        // since the server now agrees with our state
        if (wasCompleted) {
          // Server deleted it, so 'removed' tracking is no longer needed
          const freshLocal = readLocalProgress(course.id, userId);
          const freshRemoved = new Set(freshLocal.removed);
          freshRemoved.delete(targetId);
          writeLocalProgress(course.id, userId, {
            completed: freshLocal.completed,
            removed: Array.from(freshRemoved),
          });
        }
      }
    } catch (err) {
      console.error("Server toggle error:", err);
    }
  };

  // ── Auto-mark complete (video 90% watched) ──
  const handleMarkComplete = async (targetId: string) => {
    if (completedIds.has(targetId)) return;

    const updated = new Set(completedIds);
    updated.add(targetId);

    // 1. Persist to localStorage FIRST
    const local = readLocalProgress(course.id, userId);
    const removedSet = new Set(local.removed);
    removedSet.delete(targetId); // No longer removed
    setCompletedIds(updated);
    writeLocalProgress(course.id, userId, {
      completed: Array.from(updated),
      removed: Array.from(removedSet),
    });

    // 2. Send to server in the background
    try {
      const res = await markLessonCompleteAction(targetId);
      if (!res.success) {
        console.error("Server mark-complete failed:", res.error);
      }
    } catch (err) {
      console.error("Server mark-complete error:", err);
    }
  };

  // Autoplay handler for Direct Video
  useEffect(() => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log("Autoplay blocked by browser policy, starting muted", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.log("Play failed", e);
                setIsPlaying(false);
              });
          }
        });
    }
  }, [lesson.id, isDirectVideo, decodedVideoUrl]);

  // Sync state for direct videos
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const dur = videoRef.current.duration;
      if (dur > 0 && (videoRef.current.currentTime / dur) >= 0.9) {
        handleMarkComplete(lesson.id);
      }
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // YouTube progress tracking via IFrame Player API
  useEffect(() => {
    if (!youtubeUrl) return;

    setYtPlayerReady(false);
    setIsPlaying(true); // Expect play
    setCurrentTime(0);
    setDuration(0);

    let youtubePlayer: any = null;

    const initPlayer = () => {
      try {
        youtubePlayer = new (window as any).YT.Player("youtube-iframe", {
          events: {
            onReady: (event: any) => {
              ytPlayerRef.current = event.target;
              setYtPlayerReady(true);
              // Set starting state in line with state defaults
              event.target.setPlaybackRate(playbackSpeed);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              // Autoplay
              event.target.playVideo();
              setIsPlaying(true);
            },
            onStateChange: (event: any) => {
              const state = event.data;
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (state === 1) {
                setIsPlaying(true);
              } else if (state === 2) {
                setIsPlaying(false);
              } else if (state === 0) {
                setIsPlaying(false);
                handleMarkComplete(lesson.id);
              }
            },
          },
        });
      } catch (e) {
        console.error("Error initializing YT player", e);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      const timer = setTimeout(initPlayer, 1000);
      return () => {
        clearTimeout(timer);
      };
    } else {
      // Add global callback
      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }, [lesson.id, youtubeUrl]);

  // Polling for YouTube player state updates (progress tracking)
  useEffect(() => {
    if (!youtubeUrl || !ytPlayerReady || !ytPlayerRef.current) return;

    const interval = setInterval(() => {
      try {
        const player = ytPlayerRef.current;
        if (player && typeof player.getCurrentTime === "function") {
          setCurrentTime(player.getCurrentTime());
          setDuration(player.getDuration() || 0);

          // Auto complete check at 90%
          const dur = player.getDuration();
          const cur = player.getCurrentTime();
          if (dur > 0 && (cur / dur) >= 0.9) {
            handleMarkComplete(lesson.id);
          }
        }
      } catch (e) {
        // Ignored
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ytPlayerReady, lesson.id, youtubeUrl]);

  // Controller Actions
  const handlePlayPause = () => {
    if (isDirectVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log("Play failed", e));
      }
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const handleForward10 = () => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      const newTime = Math.min(ytPlayerRef.current.getCurrentTime() + 10, duration);
      ytPlayerRef.current.seekTo(newTime, true);
    }
  };

  const handleRewind10 = () => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      const newTime = Math.max(ytPlayerRef.current.getCurrentTime() - 10, 0);
      ytPlayerRef.current.seekTo(newTime, true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.playbackRate = speed;
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      ytPlayerRef.current.setPlaybackRate(speed);
    }
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.muted = nextMute;
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      if (nextMute) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
      }
    }
  };

  const handleSeekChange = (value: number) => {
    setCurrentTime(value);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = value;
    } else if (youtubeUrl && ytPlayerReady && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(value, true);
    }
  };

  // Fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Sync fullscreen state and show toast
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);

      if (isFull) {
        // Show ESC hint toast for 2 seconds
        setShowFsToast(true);
        const timer = setTimeout(() => setShowFsToast(false), 2000);
        return () => clearTimeout(timer);
      } else {
        setShowFsToast(false);
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Close quality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    if (showQualityMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showQualityMenu]);

  // Handle quality change
  const handleQualityChange = (quality: "480" | "720") => {
    setVideoQuality(quality);
    setShowQualityMenu(false);
    // TODO: Implement actual quality switching when backend supports multiple quality URLs
  };

  // Mock attachments data — UI only, will be replaced with real data later
  const mockAttachments = [
    { id: "1", name: "ملخص الدرس.pdf", size: "2.4 MB" },
    { id: "2", name: "تمارين إضافية.pdf", size: "1.1 MB" },
  ];

  // Progress calculations
  const totalLessons = allLessons.length;
  const completedCount = completedIds.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Right/Main Content: Video Player and Details */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        {/* Custom Interactive Video Player Box */}
        <div className="flex flex-col gap-3">
          <div ref={videoContainerRef} className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#1A2235] shadow-2xl">

            {/* The transparent click blocker overlay */}
            <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto cursor-default" />

            {/* Fullscreen ESC toast overlay */}
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/85 backdrop-blur-md text-[#F0EDE6] text-sm px-5 py-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-none transition-all duration-500 flex items-center gap-1.5 ${showFsToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
            >
              <span>اضغط</span>
              <kbd className="px-2 py-0.5 rounded bg-white/20 font-mono text-xs text-[#FBBF24] border border-white/10">ESC</kbd>
              <span>للمغادرة من وضع ملء الشاشة</span>
            </div>

            {youtubeUrl ? (
              <iframe
                id="youtube-iframe"
                src={youtubeUrl}
                className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={lesson.title}
              />
            ) : vimeoUrl ? (
              <iframe
                src={vimeoUrl}
                className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                allow="autoplay; fullscreen"
                title={lesson.title}
              />
            ) : isDirectVideo && decodedVideoUrl ? (
              <video
                ref={videoRef}
                src={decodedVideoUrl}
                autoPlay
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#F0EDE6]/40 p-6 text-center gap-3">
                <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-7.5 3.75h7.5m-7.5 0h7.5m8.625-10.5H12m8.625 0a9 9 0 11-18 0 9 9 0 0118 0zm-8.625 0H12" />
                </svg>
                <p className="text-lg font-medium">لا يوجد فيديو متوفر لهذا الدرس</p>
              </div>
            )}
          </div>

          {/* Unified Custom Controller Bar */}
          <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-4 shadow-xl flex flex-col gap-3" dir="rtl">

            {/* Timeline seek bar */}
            <div className="flex items-center gap-3 flex-row">
              <span className="text-xs font-mono text-[#F0EDE6]/60 w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeekChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FBBF24] hover:accent-[#FBBF24]/90"
              />
              <span className="text-xs font-mono text-[#F0EDE6]/60 w-10 text-left">{formatTime(duration)}</span>
            </div>

            {/* Controls panel */}
            <div className="flex items-center justify-between flex-wrap gap-4">

              {/* Playback Controls (Play/Pause, Rewind, Fast Forward) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRewind10}
                  title="رجوع 10 ثواني"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F0EDE6] active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePlayPause}
                  title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  className="p-2.5 rounded-xl bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0F1623] active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <button
                  onClick={handleForward10}
                  title="تقديم 10 ثواني"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F0EDE6] active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {[1, 1.5, 2, 3].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${playbackSpeed === speed
                      ? "bg-[#FBBF24] text-[#0F1623]"
                      : "text-[#F0EDE6]/70 hover:text-[#F0EDE6]"
                      }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Quality Selector, Mute, and Fullscreen */}
              <div className="flex items-center gap-3">

                {/* Video Quality Dropdown */}
                <div ref={qualityMenuRef} className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    title="جودة الفيديو"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      showQualityMenu
                        ? "bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-[#FBBF24]"
                        : "bg-white/5 hover:bg-white/10 text-[#F0EDE6]/70 hover:text-[#F0EDE6]"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="font-mono">{videoQuality}p</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showQualityMenu ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showQualityMenu && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1A2235] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[120px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="px-3 py-2 text-[10px] font-bold text-[#F0EDE6]/40 uppercase tracking-wider border-b border-white/5">
                        جودة الفيديو
                      </div>
                      {(["720", "480"] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQualityChange(q)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                            videoQuality === q
                              ? "bg-[#FBBF24]/10 text-[#FBBF24]"
                              : "text-[#F0EDE6]/70 hover:bg-white/5 hover:text-[#F0EDE6]"
                          }`}
                        >
                          <span className="font-mono font-bold">{q}p</span>
                          {videoQuality === q && (
                            <Check className="w-3.5 h-3.5 text-[#FBBF24]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleMuteToggle}
                  title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${isMuted
                    ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                    : "bg-white/5 hover:bg-white/10 text-[#FBBF24]"
                    }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleFullscreenToggle}
                  title={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F0EDE6] hover:text-[#FBBF24] active:scale-95 transition-all cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Lesson Details Card */}
        <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 md:p-8 shadow-xl flex flex-col gap-6 text-right">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#F0EDE6] leading-tight">
                {lesson.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-[#F0EDE6]/40 mt-2">
                <span className="bg-white/5 px-2.5 py-1 rounded-md text-[#FBBF24] font-medium font-mono">
                  الدرس {lesson.order_index ?? allLessons.findIndex(l => l.id === lesson.id) + 1}
                </span>
                <span>•</span>
                <span>
                  تم النشر في:{" "}
                  {new Date(lesson.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Mark as Complete Button */}
            <button
              onClick={() => handleToggleComplete(lesson.id)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${isCurrentCompleted
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-[#FBBF24] text-[#0F1623] hover:bg-[#FBBF24]/90"
                }`}
            >
              {isCurrentCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>اكتمل الدرس</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  <span>تحديد كمكتمل</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar (Main details area) */}
          <div className="bg-[#0F1623] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#F0EDE6]/60 flex-row-reverse">
              <span className="font-mono text-sm font-semibold">{progressPercentage}%</span>
              <span className="font-bold text-[#FBBF24]">مدى تقدمك في الكورس</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-[#FBBF24] to-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#F0EDE6]/40 mt-1 flex-row-reverse">
              <span>تم إكمال {completedCount} من أصل {totalLessons} دروس</span>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {lesson.content ? (
            <div className="text-[#F0EDE6]/80 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          ) : (
            <p className="text-[#F0EDE6]/40 italic text-sm">لا توجد تفاصيل أو وصف متوفر لهذا الدرس.</p>
          )}
        </div>

        {/* Attachments Section */}
        {mockAttachments.length > 0 && (
          <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 md:p-8 shadow-xl flex flex-col gap-5 text-right">

            {/* Section Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#FBBF24]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#F0EDE6]">المرفقات</h3>
                <p className="text-xs text-[#F0EDE6]/40 mt-0.5">
                  ملفات PDF مرفقة مع هذا الدرس
                </p>
              </div>
              <span className="text-xs text-[#F0EDE6]/50 bg-white/5 px-2.5 py-1 rounded-full font-bold font-mono">
                {mockAttachments.length} ملف
              </span>
            </div>

            {/* Attachment Items */}
            <div className="flex flex-col gap-3">
              {mockAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-[#0F1623] border border-white/5 hover:border-[#FBBF24]/20 transition-all duration-300"
                >
                  {/* PDF Icon */}
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/15 transition-colors">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F0EDE6] truncate group-hover:text-[#FBBF24] transition-colors">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-[#F0EDE6]/40 mt-0.5 font-mono">
                      PDF • {attachment.size}
                    </p>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement actual download when backend is ready
                      console.log("Download attachment:", attachment.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] hover:bg-[#FBBF24] hover:text-[#0F1623] font-bold text-xs transition-all duration-300 cursor-pointer active:scale-95 flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Left Column: Lessons Sidebar Navigation */}
      <div className="flex flex-col gap-6 text-right">
        <div className="rounded-2xl bg-[#1A2235] border border-white/10 p-6 shadow-xl flex flex-col gap-4">

          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-row-reverse">
            <h3 className="font-bold text-lg text-[#FBBF24]">دروس الكورس</h3>
            <span className="text-xs text-[#F0EDE6]/50 bg-white/5 px-2.5 py-1 rounded-full font-bold">
              {allLessons.length} دروس
            </span>
          </div>

          {/* Progress Bar inside Sidebar */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-[#F0EDE6]/60 flex-row-reverse">
              <span className="font-mono font-bold text-[#FBBF24]">{progressPercentage}%</span>
              <span>نسبة الإنجاز:</span>
            </div>
            <div className="w-full h-2 bg-[#0F1623] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FBBF24] transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1">
            {allLessons.map((item, index) => {
              const isCurrent = item.id === lesson.id;
              const isCompleted = completedIds.has(item.id);
              return (
                <Link
                  key={item.id}
                  href={`/courses/${rawId}/lessons/${item.id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border relative overflow-hidden group ${isCurrent
                    ? "bg-[#0F1623] border-[#FBBF24]/40 text-[#FBBF24] font-bold shadow-md shadow-black/10"
                    : "bg-white/5 border-transparent text-[#F0EDE6]/80 hover:bg-white/10 hover:text-[#FBBF24]"
                    }`}
                >
                  <span className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${isCurrent ? "bg-[#FBBF24] text-[#0F1623]" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-[#F0EDE6]/60"
                    }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.order_index ?? index + 1}
                  </span>

                  <span className="text-sm line-clamp-2 leading-snug relative z-10">
                    {item.title}
                  </span>

                  {isCompleted && !isCurrent && (
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500/40" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Back to Course button in Sidebar */}
        <Link
          href={`/courses/${rawId}`}
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 transition-all text-[#F0EDE6] hover:text-[#FBBF24] text-center font-bold text-sm"
        >
          العودة لصفحة الكورس الرئيسية
        </Link>
      </div>

    </div>
  );
}
