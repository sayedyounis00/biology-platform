import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "منصة مستر أحمد سعد للأحياء",
    short_name: "أحمد سعد أحياء",
    description: "المنصة التعليمية الأولى لتبسيط مادة الأحياء لطلاب الثانوية العامة مع مستر أحمد سعد.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1623",
    theme_color: "#0f1623",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
